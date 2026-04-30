import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentActivationService } from './payment-activation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ThawaniService } from './thawani.service';
import { NotificationsService } from '../notifications/notifications.service';

// ── Mock Factories ──

const createMockPrisma = () => {
  const mock: any = {
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    paymentEvent: { create: jest.fn() },
    listing: { update: jest.fn() },
    busListing: { update: jest.fn() },
    equipmentListing: { update: jest.fn() },
    subscription: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((arg: any) => {
      if (typeof arg === 'function') return arg(mock);
      return Promise.all(arg);
    }),
  };
  return mock;
};

const PAID_PAYMENT = {
  id: 'pay-1',
  status: 'PAID',
  type: 'FEATURED',
  entityType: 'LISTING',
  entityId: 'ent-1',
  amount: 2000,
  userId: 'user-1',
  metadata: null,
};

const PROCESSING_PAYMENT = {
  ...PAID_PAYMENT,
  status: 'PROCESSING',
};

const PENDING_PAYMENT = {
  ...PAID_PAYMENT,
  status: 'PENDING',
  thawaniSessionId: null,
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let thawani: Record<string, jest.Mock>;
  let notifications: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.PAYMENTS_ENABLED;

    prisma = createMockPrisma();
    thawani = {
      createSession: jest.fn().mockResolvedValue({ session_id: 'sess_123' }),
      getSession: jest.fn(),
      getCheckoutUrl: jest.fn().mockReturnValue('https://checkout.thawani.om/sess_123'),
    };
    notifications = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PaymentActivationService,
        { provide: PrismaService, useValue: prisma },
        { provide: ThawaniService, useValue: thawani },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  // helper: setup for a clean createFeaturedPayment call
  const setupCleanCreate = () => {
    prisma.payment.count.mockResolvedValue(0);
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({ id: 'pay-new', status: 'PENDING' });
    prisma.payment.update.mockResolvedValue({ id: 'pay-new', status: 'PROCESSING' });
  };

  // ═══════════════════════════════════════
  // 1. Feature Flag
  // ═══════════════════════════════════════

  describe('Feature Flag', () => {
    it('T01 — should throw when PAYMENTS_ENABLED=false', async () => {
      process.env.PAYMENTS_ENABLED = 'false';

      await expect(
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('T02 — should allow when PAYMENTS_ENABLED is not false', async () => {
      process.env.PAYMENTS_ENABLED = 'true';
      setupCleanCreate();

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1',
      );

      expect(result.paymentId).toBe('pay-new');
    });
  });

  // ═══════════════════════════════════════
  // 2. Fraud Detection
  // ═══════════════════════════════════════

  describe('Fraud Detection', () => {
    it('T03 — should block user with ≥10 attempts/hour', async () => {
      prisma.payment.count.mockResolvedValue(10);

      await expect(
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1', '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('T04 — should block IP with ≥15 attempts/hour', async () => {
      prisma.payment.count
        .mockResolvedValueOnce(5)   // user OK
        .mockResolvedValueOnce(15); // IP blocked

      await expect(
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1', '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('T05 — should allow user with few attempts', async () => {
      setupCleanCreate();
      prisma.payment.count.mockResolvedValue(2);

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1',
      );

      expect(result.paymentId).toBe('pay-new');
    });
  });

  // ═══════════════════════════════════════
  // 3. Idempotency
  // ═══════════════════════════════════════

  describe('Idempotency', () => {
    it('T06 — should return existing payment for duplicate key', async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-existing', thawaniSessionId: 'sess_old',
      });

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1', undefined, 'idem-1',
      );

      expect(result.paymentId).toBe('pay-existing');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════
  // 4. Double Payment Prevention
  // ═══════════════════════════════════════

  describe('Double Payment Prevention', () => {
    it('T07 — should reuse pending featured payment', async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-pending', thawaniSessionId: 'sess_old',
      });

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1',
      );

      expect(result.paymentId).toBe('pay-pending');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('T08 — should reuse pending subscription payment', async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'sub-pending', thawaniSessionId: 'sess_sub',
      });

      const result = await service.createSubscriptionPayment({ plan: 'PRO' }, 'u1');

      expect(result.paymentId).toBe('sub-pending');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════
  // 5. Create Payments
  // ═══════════════════════════════════════

  describe('Create Payments', () => {
    it('T09 — should create featured payment + Thawani session', async () => {
      setupCleanCreate();

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1', '1.2.3.4',
      );

      expect(result.sessionId).toBe('sess_123');
      expect(thawani.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          clientReferenceId: 'pay-new',
          products: [expect.objectContaining({ unit_amount: 2000 })],
        }),
      );
    });

    it('T10 — should reject invalid subscription plan', async () => {
      prisma.payment.count.mockResolvedValue(0);

      await expect(
        service.createSubscriptionPayment({ plan: 'INVALID' as any }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════
  // 6. State Machine
  // ═══════════════════════════════════════

  describe('State Machine', () => {
    it('T11 — PROCESSING → PAID via reconcile', async () => {
      prisma.payment.findUnique.mockResolvedValue(PROCESSING_PAYMENT);
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      await service.reconcilePayment('pay-1');

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });

    it('T12 — should skip reconcile for already PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue(PAID_PAYMENT);

      await service.reconcilePayment('pay-1');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('T13 — PENDING → EXPIRED via markExpired', async () => {
      prisma.payment.findUnique.mockResolvedValue({ ...PENDING_PAYMENT });
      prisma.payment.update.mockResolvedValue({ ...PENDING_PAYMENT, status: 'EXPIRED' });

      await service.markExpired('pay-1');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'EXPIRED' }),
        }),
      );
    });

    it('T14 — should skip markExpired on PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue(PAID_PAYMENT);

      await service.markExpired('pay-1');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════
  // 7. Verify Payment
  // ═══════════════════════════════════════

  describe('verifyPayment', () => {
    it('T15 — should activate when Thawani says paid', async () => {
      thawani.getSession.mockResolvedValue({ payment_status: 'paid' });
      prisma.payment.findUnique
        .mockResolvedValueOnce(PROCESSING_PAYMENT) // lookup by session
        .mockResolvedValueOnce(PROCESSING_PAYMENT); // handlePaymentSuccess lookup
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      const result = await service.verifyPayment('sess_123');

      expect(result.status).toBe('paid');
      expect(prisma.payment.updateMany).toHaveBeenCalled();
    });

    it('T16 — should throw for unknown session', async () => {
      thawani.getSession.mockResolvedValue({ payment_status: 'pending' });
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.verifyPayment('sess_unknown')).rejects.toThrow(NotFoundException);
    });

    it('T17 — should expire when Thawani says cancelled', async () => {
      thawani.getSession.mockResolvedValue({ payment_status: 'cancelled' });
      prisma.payment.findUnique
        .mockResolvedValueOnce(PROCESSING_PAYMENT)  // lookup by session
        .mockResolvedValueOnce(PROCESSING_PAYMENT); // markExpired lookup
      prisma.payment.update.mockResolvedValue({ ...PROCESSING_PAYMENT, status: 'EXPIRED' });

      const result = await service.verifyPayment('sess_123');
      expect(result.status).toBe('cancelled');
    });
  });

  // ═══════════════════════════════════════
  // 8. Webhook
  // ═══════════════════════════════════════

  describe('handleWebhook', () => {
    it('T18 — should activate on paid webhook', async () => {
      prisma.payment.findUnique
        .mockResolvedValueOnce(PROCESSING_PAYMENT) // lookup by session
        .mockResolvedValueOnce(PROCESSING_PAYMENT); // handlePaymentSuccess
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      const result = await service.handleWebhook({
        data: { session_id: 'sess_123', payment_status: 'paid' },
      });

      expect(result.received).toBe(true);
      expect(prisma.payment.updateMany).toHaveBeenCalled();
    });

    it('T19 — should skip duplicate webhook for PAID', async () => {
      prisma.payment.findUnique.mockResolvedValue(PAID_PAYMENT);

      const result = await service.handleWebhook({
        data: { session_id: 'sess_123', payment_status: 'paid' },
      });

      expect(result.received).toBe(true);
    });

    it('T20 — should handle missing session_id', async () => {
      const result = await service.handleWebhook({ data: {} });
      expect(result.received).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // 9. Subscription & Data
  // ═══════════════════════════════════════

  describe('Subscription & Data', () => {
    it('T21 — should cancel auto-renewal', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ userId: 'u1', autoRenew: true });
      prisma.subscription.update.mockResolvedValue({});

      const result = await service.cancelSubscription('u1');

      expect(result.message).toContain('إلغاء');
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { autoRenew: false } }),
      );
    });

    it('T22 — should throw if no subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.cancelSubscription('u1')).rejects.toThrow(NotFoundException);
    });

    it('T23 — getPlans returns 3 plans', async () => {
      const plans = await service.getPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p: any) => p.plan)).toEqual(['BASIC', 'PRO', 'ENTERPRISE']);
    });

    it('T24 — myPayments returns paginated result', async () => {
      prisma.payment.findMany.mockResolvedValue([{ id: 'pay-1' }]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.myPayments('u1', 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  // ═══════════════════════════════════════
  // 10. Event Logging
  // ═══════════════════════════════════════

  describe('Event Logging', () => {
    it('T25 — should log CREATED on new payment', async () => {
      setupCleanCreate();

      await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1',
      );

      expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event: 'CREATED' }),
        }),
      );
    });

    it('T26 — should log WEBHOOK_RECEIVED', async () => {
      prisma.payment.findUnique.mockResolvedValue(PAID_PAYMENT);

      await service.handleWebhook({
        data: { session_id: 'sess_123', payment_status: 'paid' },
      });

      expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event: 'WEBHOOK_RECEIVED' }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════
  // 11. Concurrency
  // ═══════════════════════════════════════

  describe('Concurrency', () => {
    it('T27 — concurrent create for same entity — second reuses pending', async () => {
      let callCount = 0;
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findUnique.mockResolvedValue(null);

      prisma.payment.findFirst.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return null;
        return { id: 'pay-first', thawaniSessionId: 'sess_first' };
      });
      prisma.payment.create.mockResolvedValue({ id: 'pay-first', status: 'PENDING' });
      prisma.payment.update.mockResolvedValue({ id: 'pay-first', status: 'PROCESSING' });

      const [r1, r2] = await Promise.all([
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1'),
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1'),
      ]);

      expect(r1.paymentId).toBe('pay-first');
      expect(r2.paymentId).toBe('pay-first');
      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    });

    it('T28 — concurrent requests with same idempotency key — no double create', async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-idem', thawaniSessionId: 'sess_idem',
      });

      const [r1, r2] = await Promise.all([
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1', undefined, 'key-1'),
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1', undefined, 'key-1'),
      ]);

      expect(r1.paymentId).toBe('pay-idem');
      expect(r2.paymentId).toBe('pay-idem');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('T29 — concurrent webhook + verify — no crash, payment activated', async () => {
      thawani.getSession.mockResolvedValue({ payment_status: 'paid' });

      prisma.payment.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.thawaniSessionId) return PROCESSING_PAYMENT;
        if (args?.where?.id) return PROCESSING_PAYMENT;
        return null;
      });
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      await Promise.all([
        service.handleWebhook({ data: { session_id: 'sess_123', payment_status: 'paid' } }),
        service.verifyPayment('sess_123'),
      ]);

      expect(prisma.payment.updateMany).toHaveBeenCalled();
    });

    it('T30 — concurrent reconcile + webhook — no crash', async () => {
      prisma.payment.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.thawaniSessionId) return PROCESSING_PAYMENT;
        if (args?.where?.id) return PROCESSING_PAYMENT;
        return null;
      });
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      await Promise.all([
        service.reconcilePayment('pay-1'),
        service.handleWebhook({ data: { session_id: 'sess_123', payment_status: 'paid' } }),
      ]);

      expect(prisma.payment.updateMany).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════
  // 12. Failure & Resilience
  // ═══════════════════════════════════════

  describe('Failure & Resilience', () => {
    it('T31 — Thawani createSession fails → error thrown, no transition', async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({ id: 'pay-fail', status: 'PENDING' });
      thawani.createSession.mockRejectedValueOnce(new Error('Thawani API down'));

      await expect(
        service.createFeaturedPayment({ entityType: 'LISTING', entityId: 'e1' }, 'u1'),
      ).rejects.toThrow('Thawani API down');

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('T32 — Thawani getSession fails on verify → error propagated', async () => {
      thawani.getSession.mockRejectedValueOnce(new Error('Thawani timeout'));

      await expect(service.verifyPayment('sess_123')).rejects.toThrow('Thawani timeout');
    });

    it('T33 — event logging fails → payment still succeeds (non-critical)', async () => {
      prisma.paymentEvent.create.mockRejectedValue(new Error('DB event log failed'));
      setupCleanCreate();

      const result = await service.createFeaturedPayment(
        { entityType: 'LISTING', entityId: 'e1' }, 'u1',
      );

      expect(result.paymentId).toBe('pay-new');
    });

    it('T34 — notification fails → payment still succeeds (non-critical)', async () => {
      notifications.create.mockRejectedValue(new Error('Notification service down'));

      prisma.payment.findUnique.mockResolvedValue(PROCESSING_PAYMENT);
      prisma.payment.findUniqueOrThrow.mockResolvedValue(PAID_PAYMENT);

      await service.reconcilePayment('pay-1');

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });

    it('T35 — malformed webhook bodies → graceful handling', async () => {
      const malformedBodies = [
        { data: null },
        {},
        undefined,
        { data: { session_id: null } },
        { random: 'garbage' },
      ];

      for (const body of malformedBodies) {
        const result = await service.handleWebhook(body);
        expect(result.received).toBe(true);
      }
    });
  });
});
