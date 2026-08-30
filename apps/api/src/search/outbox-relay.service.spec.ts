import { Test, TestingModule } from '@nestjs/testing';
import { OutboxRelayService } from './outbox-relay.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

describe('OutboxRelayService', () => {
  let service: OutboxRelayService;
  let prisma: any;
  let queue: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      outboxEvent: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    queue = {
      addBulk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxRelayService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('search-sync'), useValue: queue },
      ],
    }).compile();

    service = module.get<OutboxRelayService>(OutboxRelayService);

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should skip processing if already running (isProcessing guard)', async () => {
    (service as any).isProcessing = true;
    await service.processOutboxEvents();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should not process events where availableAt is in the future', async () => {
    let tx: any;
    prisma.$transaction.mockImplementation(async (callback: any) => {
      tx = {
        outboxEvent: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      await callback(tx);
    });

    await service.processOutboxEvents();

    // Verify the availableAt filter was actually applied to the query,
    // not just that an empty result happened to come back.
    expect(tx.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          availableAt: { lte: expect.any(Date) },
        }),
      }),
    );
    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('should process PENDING outbox events and mark them COMPLETED', async () => {
    const mockEvents = [
      { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 0 },
    ];

    let tx: any;
    prisma.$transaction.mockImplementation(async (callback: any) => {
      tx = {
        outboxEvent: {
          findMany: jest.fn().mockResolvedValue([{ id: '1' }]),
          updateMany: jest.fn(),
        },
        $queryRaw: jest.fn().mockResolvedValue(mockEvents),
      };
      await callback(tx);
    });

    await service.processOutboxEvents();

    // Assertions live here, outside the mock callback — a failure here
    // is a real Jest failure, not something the production try/catch
    // can silently swallow.
    expect(queue.addBulk).toHaveBeenCalledWith([{
      name: 'sync-entity',
      data: { entityId: '123', entityType: 'LISTING', action: 'UPSERT', eventId: '1' },
      opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: true },
    }]);
    expect(tx.outboxEvent.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['1'] } },
      data: { status: 'COMPLETED', processedAt: expect.any(Date) },
    });
  });

  describe('Redis failure resilience', () => {
    it('should increment attempts and set PENDING with backoff on failure', async () => {
      const mockEvents = [
        { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 0 },
      ];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          outboxEvent: { findMany: jest.fn().mockResolvedValue([{ id: '1' }]) },
          $queryRaw: jest.fn().mockResolvedValue(mockEvents),
        };
        // Throw to simulate Redis/Bull failure in queue.addBulk inside callback
        queue.addBulk.mockRejectedValue(new Error('Redis connection failed'));
        await callback(tx);
      });

      await service.processOutboxEvents();

      expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'PENDING',
          attempts: 1,
          availableAt: expect.any(Date),
        },
      });
    });

    it('should keep events as PENDING when Redis/Bull is unavailable', async () => {
       const mockEvents = [
        { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 2 },
      ];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          outboxEvent: { findMany: jest.fn().mockResolvedValue([{ id: '1' }]) },
          $queryRaw: jest.fn().mockResolvedValue(mockEvents),
        };
        queue.addBulk.mockRejectedValue(new Error('Redis connection failed'));
        await callback(tx);
      });

      await service.processOutboxEvents();

      expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'PENDING',
          attempts: 3,
          availableAt: expect.any(Date),
        },
      });
    });

    it('should apply exponential backoff on availableAt', async () => {
       const mockEvents = [
        { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 1 },
      ];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          outboxEvent: { findMany: jest.fn().mockResolvedValue([{ id: '1' }]) },
          $queryRaw: jest.fn().mockResolvedValue(mockEvents),
        };
        queue.addBulk.mockRejectedValue(new Error('Redis connection failed'));
        await callback(tx);
      });

      const beforeCall = Date.now();
      await service.processOutboxEvents();

      const expectedAttempts = 2; // mockEvents[0].attempts (1) + 1
      const expectedBackoff = Math.min(expectedAttempts * 60_000, 600_000); // 120_000ms

      expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            attempts: expectedAttempts,
            availableAt: expect.any(Date),
          }),
        }),
      );

      // Verify the actual Date value matches the exponential backoff formula,
      // not just that some Date was passed.
      const actualCall = prisma.outboxEvent.update.mock.calls[0][0];
      const actualAvailableAt = actualCall.data.availableAt.getTime();
      expect(actualAvailableAt).toBeGreaterThanOrEqual(beforeCall + expectedBackoff - 100);
      expect(actualAvailableAt).toBeLessThanOrEqual(beforeCall + expectedBackoff + 1000);
    });

    it('should mark event as FAILED after 5 attempts', async () => {
      const mockEvents = [
        { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 4 },
      ];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          outboxEvent: { findMany: jest.fn().mockResolvedValue([{ id: '1' }]) },
          $queryRaw: jest.fn().mockResolvedValue(mockEvents),
        };
        queue.addBulk.mockRejectedValue(new Error('Redis error'));
        await callback(tx);
      });

      await service.processOutboxEvents();

      expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'FAILED',
          attempts: 5,
        },
      });
    });

    it('should log error when event permanently fails', async () => {
      const mockEvents = [
        { id: '1', entityType: 'LISTING', entityId: '123', action: 'UPSERT', attempts: 4 },
      ];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          outboxEvent: { findMany: jest.fn().mockResolvedValue([{ id: '1' }]) },
          $queryRaw: jest.fn().mockResolvedValue(mockEvents),
        };
        queue.addBulk.mockRejectedValue(new Error('Redis error'));
        await callback(tx);
      });

      await service.processOutboxEvents();

      expect(Logger.prototype.error).toHaveBeenCalledWith('OutboxEvent 1 permanently failed after 5 attempts');
    });
  });
});
