import 'reflect-metadata';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AdminPaymentsController } from './admin-payments.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_DLQ } from './payment-webhook.processor';

describe('AdminPaymentsController (Unit)', () => {
  let controller: AdminPaymentsController;
  let prisma: any;
  let dlq: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      payment: {
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      paymentEvent: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    dlq = {
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getWaiting: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken(PAYMENT_DLQ), useValue: dlq },
      ],
    }).compile();

    controller = module.get<AdminPaymentsController>(AdminPaymentsController);
  });

  describe('Security & Guard Metadata', () => {
    it('is registered under the "admin/payments" route path', () => {
      const path = Reflect.getMetadata(PATH_METADATA, AdminPaymentsController);
      expect(path).toBe('admin/payments');
    });

    it('enforces JwtAuthGuard and RolesGuard at the controller level', () => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, AdminPaymentsController) || [];
      const guardNames = guards.map((g: any) => g.name || g.constructor?.name);
      expect(guardNames).toEqual(['JwtAuthGuard', 'RolesGuard']);
    });

    it('enforces ADMIN role requirement across all endpoints', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, AdminPaymentsController);
      expect(roles).toEqual(['ADMIN']);
    });
  });

  describe('findAll', () => {
    it('returns paginated items and metadata via transaction', async () => {
      const mockItems = [{ id: 'p1', amount: 5000, status: 'PAID' }];
      prisma.$transaction.mockResolvedValue([mockItems, 1]);

      const result = await controller.findAll(1, 20);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        items: mockItems,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    });
  });

  describe('getStats', () => {
    it('aggregates revenue and status breakdown via transaction', async () => {
      prisma.$transaction.mockResolvedValue([
        { _sum: { amount: 15000 }, _count: 3 },
        [{ status: 'PAID', _count: 3 }],
        2,
        [],
      ]);

      const result = await controller.getStats();

      expect(result.totalRevenueBaisa).toBe(15000);
      expect(result.totalRevenueOMR).toBe('15.000');
      expect(result.totalPaidCount).toBe(3);
      expect(result.todayPayments).toBe(2);
      expect(result.byStatus).toEqual({ PAID: 3 });
      expect(result.fraudSignals).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('computes metrics and polls DLQ counts from the queue', async () => {
      prisma.$transaction
        .mockResolvedValueOnce([10, 8]) // totalCount, paidCount
        .mockResolvedValueOnce([5, 0]); // webhookTotal, webhookFailed
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.groupBy.mockResolvedValue([]);
      // for 7-day daily volume loop:
      prisma.$transaction.mockResolvedValue([1, { _sum: { amount: 1000 } }]);

      dlq.getWaitingCount.mockResolvedValue(2);
      dlq.getFailedCount.mockResolvedValue(1);

      const result = await controller.getMetrics();

      expect(result.successRate).toBe('80.0%');
      expect(result.totalPayments).toBe(10);
      expect(result.paidPayments).toBe(8);
      expect(result.dlq).toEqual({ waiting: 2, failed: 1 });
      expect(dlq.getWaitingCount).toHaveBeenCalledTimes(1);
      expect(dlq.getFailedCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDlqJobs', () => {
    it('returns waiting and failed jobs from the DLQ queue', async () => {
      const mockWaiting = [{ id: 'job-1', data: { paymentId: 'p1' }, timestamp: 123456 }];
      const mockFailed = [{ id: 'job-2', data: { paymentId: 'p2' }, failedReason: 'Timeout', timestamp: 123457 }];

      dlq.getWaiting.mockResolvedValue(mockWaiting);
      dlq.getFailed.mockResolvedValue(mockFailed);

      const result = await controller.getDlqJobs();

      expect(result.waiting).toEqual(mockWaiting);
      expect(result.failed).toEqual(mockFailed);
      expect(result.counts).toEqual({ waiting: 1, failed: 1 });
    });
  });

  describe('getPaymentEvents', () => {
    it('returns payment events for a specific paymentId', async () => {
      const mockEvents = [{ id: 'e1', paymentId: 'p1', event: 'CREATED', createdAt: new Date() }];
      prisma.paymentEvent.findMany.mockResolvedValue(mockEvents);

      const result = await controller.getPaymentEvents('p1');

      expect(prisma.paymentEvent.findMany).toHaveBeenCalledWith({
        where: { paymentId: 'p1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual({ paymentId: 'p1', events: mockEvents });
    });
  });
});
