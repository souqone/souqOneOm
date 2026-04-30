import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  ConflictException,
} from '@nestjs/common';
import { PaymentStatus, Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ThawaniService } from './thawani.service';
import { CreateFeaturedPaymentDto } from './dto/create-featured-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { PaymentActivationService } from './payment-activation.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['PROCESSING', 'FAILED', 'EXPIRED'],
  PROCESSING: ['PAID', 'FAILED', 'EXPIRED'],
  PAID:       ['REFUNDED'],
  FAILED:     [],
  EXPIRED:    [],
  REFUNDED:   [],
};

const FEATURED_PRICE_BAISA = 2000; // 2 OMR

const PLAN_PRICES: Record<string, { baisa: number; name: string }> = {
  PRO: { baisa: 5000, name: 'اشتراك برو' },
  ENTERPRISE: { baisa: 15000, name: 'اشتراك إنتربرايز' },
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly thawani: ThawaniService,
    private readonly activation: PaymentActivationService,
  ) {}

  private assertEnabled() {
    if (process.env.PAYMENTS_ENABLED === 'false') {
      throw new ServiceUnavailableException('خدمة الدفع متوقفة مؤقتاً');
    }
  }

  private async logEvent(paymentId: string, event: string, data?: any) {
    try {
      await this.prisma.paymentEvent.create({
        data: { paymentId, event, data: data ?? undefined },
      });
    } catch (err) {
      this.logger.warn(`Failed to log payment event: ${(err as Error).message}`);
    }
  }

  private async transitionStatus(paymentId: string, from: PaymentStatus, to: PaymentStatus, extra?: Record<string, any>) {
    const allowed = VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      this.logger.error(`Invalid transition: ${from} → ${to} for payment ${paymentId}`);
      await this.logEvent(paymentId, 'INVALID_TRANSITION', { from, to });
      throw new ConflictException(`Cannot transition from ${from} to ${to}`);
    }

    const data: any = { status: to, ...extra };
    const payment = await this.prisma.payment.update({ where: { id: paymentId }, data });
    await this.logEvent(paymentId, `STATUS_${to}`, { from });
    return payment;
  }

  private async transitionStatusIfCurrent(
    paymentId: string,
    from: PaymentStatus,
    to: PaymentStatus,
    extra?: Record<string, any>,
  ) {
    const allowed = VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      this.logger.error(`Invalid transition: ${from} → ${to} for payment ${paymentId}`);
      await this.logEvent(paymentId, 'INVALID_TRANSITION', { from, to });
      throw new ConflictException(`Cannot transition from ${from} to ${to}`);
    }

    const data: any = { status: to, ...extra };
    const result = await this.prisma.payment.updateMany({
      where: { id: paymentId, status: from },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await this.logEvent(paymentId, `STATUS_${to}`, { from });
    return payment;
  }

  private async checkFraud(userId: string, ip?: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 3600_000);

    // Rule 1: > 10 attempts per user per hour
    const userAttempts = await this.prisma.payment.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    });
    if (userAttempts >= 10) {
      this.logger.warn(`FRAUD: user ${userId} has ${userAttempts} attempts in 1h`);
      throw new BadRequestException('تم تجاوز الحد الأقصى لمحاولات الدفع. حاول لاحقاً.');
    }

    // Rule 2: > 15 attempts per IP per hour
    if (ip) {
      const ipAttempts = await this.prisma.payment.count({
        where: { ipAddress: ip, createdAt: { gte: oneHourAgo } },
      });
      if (ipAttempts >= 15) {
        this.logger.warn(`FRAUD: IP ${ip} has ${ipAttempts} attempts in 1h`);
        throw new BadRequestException('تم تجاوز الحد الأقصى لمحاولات الدفع. حاول لاحقاً.');
      }
    }
  }

  // ── Featured listing payment ──

  async createFeaturedPayment(dto: CreateFeaturedPaymentDto, userId: string, ip?: string, idempotencyKey?: string) {
    this.assertEnabled();
    await this.checkFraud(userId, ip);

    // Idempotency: return existing payment for same key
    if (idempotencyKey) {
      const byKey = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
      if (byKey?.thawaniSessionId) {
        return {
          paymentId: byKey.id,
          checkoutUrl: this.thawani.getCheckoutUrl(byKey.thawaniSessionId),
          sessionId: byKey.thawaniSessionId,
        };
      }
    }

    const { payment, isExisting } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: {
          userId,
          type: 'FEATURED',
          entityType: dto.entityType,
          entityId: dto.entityId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      });
      if (existing) {
        return { payment: existing, isExisting: true };
      }

      const created = await tx.payment.create({
        data: {
          userId,
          amount: FEATURED_PRICE_BAISA,
          type: 'FEATURED',
          entityType: dto.entityType,
          entityId: dto.entityId,
          ipAddress: ip,
          idempotencyKey,
        },
      });

      return { payment: created, isExisting: false };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    if (isExisting && payment.thawaniSessionId) {
      this.logger.warn(`Reusing pending payment ${payment.id} for ${dto.entityType}:${dto.entityId}`);
      return {
        paymentId: payment.id,
        checkoutUrl: this.thawani.getCheckoutUrl(payment.thawaniSessionId),
        sessionId: payment.thawaniSessionId,
      };
    }

    if (isExisting) {
      throw new ConflictException('توجد عملية دفع قيد المعالجة لهذا الإعلان');
    }

    const baseUrl = process.env.WEB_URL || 'http://localhost:3000';

    await this.logEvent(payment.id, 'CREATED', { entityType: dto.entityType, entityId: dto.entityId });

    const session = await this.thawani.createSession({
      clientReferenceId: payment.id,
      products: [{ name: 'إعلان مميز — 30 يوم', quantity: 1, unit_amount: FEATURED_PRICE_BAISA }],
      successUrl: `${baseUrl}/payment/success?session_id={session_id}`,
      cancelUrl: `${baseUrl}/payment/cancel`,
      metadata: { paymentId: payment.id, type: 'FEATURED' },
    });

    await this.transitionStatus(payment.id, 'PENDING', 'PROCESSING', {
      thawaniSessionId: session.session_id,
    });

    await this.logEvent(payment.id, 'SESSION_CREATED', { sessionId: session.session_id });
    this.logger.log(`Featured payment created: ${payment.id} for ${dto.entityType}:${dto.entityId} by user ${userId}`);

    return {
      paymentId: payment.id,
      checkoutUrl: this.thawani.getCheckoutUrl(session.session_id),
      sessionId: session.session_id,
    };
  }

  // ── Subscription payment ──

  async createSubscriptionPayment(dto: CreateSubscriptionPaymentDto, userId: string, ip?: string, idempotencyKey?: string) {
    this.assertEnabled();
    await this.checkFraud(userId, ip);

    const planInfo = PLAN_PRICES[dto.plan];
    if (!planInfo) throw new BadRequestException('الخطة غير صالحة');

    // Idempotency
    if (idempotencyKey) {
      const byKey = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
      if (byKey?.thawaniSessionId) {
        return {
          paymentId: byKey.id,
          checkoutUrl: this.thawani.getCheckoutUrl(byKey.thawaniSessionId),
          sessionId: byKey.thawaniSessionId,
        };
      }
    }

    const { payment, isExisting } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { userId, type: 'SUBSCRIPTION', status: { in: ['PENDING', 'PROCESSING'] } },
      });
      if (existing) {
        return { payment: existing, isExisting: true };
      }

      const created = await tx.payment.create({
        data: {
          userId,
          amount: planInfo.baisa,
          type: 'SUBSCRIPTION',
          metadata: { plan: dto.plan },
          ipAddress: ip,
          idempotencyKey,
        },
      });

      return { payment: created, isExisting: false };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    if (isExisting && payment.thawaniSessionId) {
      this.logger.warn(`Reusing pending subscription payment ${payment.id} for user ${userId}`);
      return {
        paymentId: payment.id,
        checkoutUrl: this.thawani.getCheckoutUrl(payment.thawaniSessionId),
        sessionId: payment.thawaniSessionId,
      };
    }

    if (isExisting) {
      throw new ConflictException('توجد عملية اشتراك قيد المعالجة بالفعل');
    }

    const baseUrl = process.env.WEB_URL || 'http://localhost:3000';

    await this.logEvent(payment.id, 'CREATED', { plan: dto.plan });

    const session = await this.thawani.createSession({
      clientReferenceId: payment.id,
      products: [{ name: planInfo.name, quantity: 1, unit_amount: planInfo.baisa }],
      successUrl: `${baseUrl}/payment/success?session_id={session_id}`,
      cancelUrl: `${baseUrl}/payment/cancel`,
      metadata: { paymentId: payment.id, type: 'SUBSCRIPTION', plan: dto.plan },
    });

    await this.transitionStatus(payment.id, 'PENDING', 'PROCESSING', {
      thawaniSessionId: session.session_id,
    });

    await this.logEvent(payment.id, 'SESSION_CREATED', { sessionId: session.session_id });
    this.logger.log(`Subscription payment created: ${payment.id} plan=${dto.plan} by user ${userId}`);

    return {
      paymentId: payment.id,
      checkoutUrl: this.thawani.getCheckoutUrl(session.session_id),
      sessionId: session.session_id,
    };
  }

  // ── Verify / Webhook ──

  async verifyPayment(sessionId: string) {
    const session = await this.thawani.getSession(sessionId);
    const payment = await this.prisma.payment.findUnique({
      where: { thawaniSessionId: sessionId },
    });

    if (!payment) throw new NotFoundException('الدفعة غير موجودة');

    if (session.payment_status === 'paid' && payment.status !== 'PAID') {
      await this.handlePaymentSuccess(payment.id);
      await this.logEvent(payment.id, 'VERIFIED', { source: 'verify_endpoint' });
    } else if (session.payment_status === 'cancelled' || session.payment_status === 'expired') {
      if (payment.status !== 'EXPIRED' && payment.status !== 'FAILED') {
        await this.markExpired(payment.id);
      }
    }

    return { status: session.payment_status, paymentId: payment.id };
  }

  async handleWebhook(body: any) {
    const sessionId = body?.data?.session_id;
    const status = body?.data?.payment_status;

    this.logger.log(`Webhook received: session=${sessionId} status=${status}`);

    if (!sessionId) return { received: true };

    const payment = await this.prisma.payment.findUnique({
      where: { thawaniSessionId: sessionId },
    });

    if (payment) {
      await this.logEvent(payment.id, 'WEBHOOK_RECEIVED', { status });
    }

    if (status === 'paid') {
      if (payment && payment.status !== 'PAID') {
        await this.handlePaymentSuccess(payment.id);
      } else if (payment) {
        this.logger.log(`Webhook duplicate — payment ${payment.id} already PAID`);
      }
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentId: string) {
    const current = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!current || current.status === 'PAID') return;

    const payment = await this.transitionStatusIfCurrent(paymentId, current.status, 'PAID', { paidAt: new Date() });
    if (!payment) return;

    this.logger.log(`Payment SUCCESS: ${payment.id} type=${payment.type} amount=${payment.amount} user=${payment.userId}`);
    await this.logEvent(paymentId, 'PAID', { type: payment.type, amount: payment.amount });

    if (payment.type === 'FEATURED' && payment.entityType && payment.entityId) {
      await this.activation.activateFeatured(payment.entityType, payment.entityId);
    }

    if (payment.type === 'SUBSCRIPTION') {
      const plan = (payment.metadata as any)?.plan as string;
      await this.activation.activateSubscription(payment.userId, plan as SubscriptionPlan, payment.id);
    }

    await this.activation.notifyPaymentSuccess(payment);
  }

  // ── User payments history ──

  async myPayments(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Subscription info ──

  async mySubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async getPlans() {
    return [
      { plan: 'BASIC', price: 0, priceLabel: 'مجاني', listings: 3, featured: 0, priority: false },
      { plan: 'PRO', price: 5, priceLabel: '5 ر.ع./شهر', listings: 20, featured: 2, priority: false },
      { plan: 'ENTERPRISE', price: 15, priceLabel: '15 ر.ع./شهر', listings: -1, featured: 10, priority: true },
    ];
  }

  // ── Reconciliation (called by cron) ──

  async reconcilePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'PAID') return;

    this.logger.log(`Reconciliation: activating payment ${paymentId}`);
    await this.handlePaymentSuccess(paymentId);
    await this.logEvent(paymentId, 'RECONCILED');
  }

  async markExpired(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    if (payment.status === 'EXPIRED' || payment.status === 'PAID') return;

    await this.transitionStatus(paymentId, payment.status, 'EXPIRED');
    this.logger.log(`Payment ${paymentId} marked EXPIRED`);
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('لا يوجد اشتراك');

    await this.prisma.subscription.update({
      where: { userId },
      data: { autoRenew: false },
    });

    return { message: 'تم إلغاء التجديد التلقائي' };
  }
}
