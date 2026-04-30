import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const FEATURED_DURATION_DAYS = 30;

@Injectable()
export class PaymentActivationService {
  private readonly logger = new Logger(PaymentActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async activateFeatured(entityType: string, entityId: string): Promise<void> {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + FEATURED_DURATION_DAYS);

    const data = { isPremium: true, featuredUntil };

    switch (entityType) {
      case 'LISTING':
        await this.prisma.listing.update({ where: { id: entityId }, data });
        break;
      case 'BUS_LISTING':
        await this.prisma.busListing.update({ where: { id: entityId }, data });
        break;
      case 'EQUIPMENT_LISTING':
        await this.prisma.equipmentListing.update({ where: { id: entityId }, data });
        break;
    }
  }

  async activateSubscription(userId: string, plan: SubscriptionPlan, paymentId: string): Promise<void> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        endDate,
        paymentId,
      },
      update: {
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
        paymentId,
      },
    });

    try {
      await this.notifications.create({
        type: 'SUBSCRIPTION_ACTIVATED',
        title: 'تم تفعيل الاشتراك',
        body: `تم تفعيل خطة ${plan}`,
        userId,
        data: { plan },
      });
    } catch (err) {
      this.logger.warn(`Failed to send subscription notification: ${(err as Error).message}`);
    }
  }

  async notifyPaymentSuccess(payment: { id: string; type: string; userId: string }): Promise<void> {
    try {
      await this.notifications.create({
        type: 'PAYMENT_SUCCESS',
        title: 'تمت عملية الدفع بنجاح',
        body: payment.type === 'FEATURED' ? 'تم تفعيل الإعلان المميز' : 'تم تفعيل الاشتراك',
        userId: payment.userId,
        data: { paymentId: payment.id },
      });
    } catch (err) {
      this.logger.warn(`Failed to send payment success notification: ${(err as Error).message}`);
    }
  }
}
