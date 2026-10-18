import { Test, TestingModule } from '@nestjs/testing';
import {
  OwnerContentVisibilityService,
  VISIBILITY_BATCH_CHUNK_SIZE,
  VisibilityCrossVerticalError,
} from './owner-content-visibility.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OWNER_VISIBILITY_REGISTRY } from '../constants/owner-visibility.registry';
import { ENTITY_TYPES } from '../constants/entity-types.constants';

describe('OwnerContentVisibilityService', () => {
  let service: OwnerContentVisibilityService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    // Construct mock delegates for each entity in the registry
    mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(mockPrisma);
      }),
      user: {
        findUnique: jest.fn().mockResolvedValue({ deletionScheduledAt: null }),
      },
      outboxEvent: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    for (const config of OWNER_VISIBILITY_REGISTRY) {
      mockPrisma[config.prismaDelegate] = {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockImplementation((args: any) =>
          Promise.resolve({ count: args?.where?.id?.in?.length ?? 1 }),
        ),
      };
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerContentVisibilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<OwnerContentVisibilityService>(OwnerContentVisibilityService);
  });

  describe('hideAllForUser', () => {
    it('should find rows with hiddenByOwnerStatus: false, update to true, create DELETE OutboxEvents, and clear Redis cache', async () => {
      // Outer read + inner transaction re-read
      mockPrisma.listing.findMany
        .mockResolvedValueOnce([{ id: 'car-1' }, { id: 'car-2' }])
        .mockResolvedValueOnce([{ id: 'car-1' }, { id: 'car-2' }]);

      mockPrisma.driverJob.findMany
        .mockResolvedValueOnce([{ id: 'job-1' }])
        .mockResolvedValueOnce([{ id: 'job-1' }]);

      mockPrisma.driverProfile.findMany
        .mockResolvedValueOnce([{ id: 'prof-1' }])
        .mockResolvedValueOnce([{ id: 'prof-1' }]);

      const result = await service.hideAllForUser('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.affectedCounts[ENTITY_TYPES.LISTING]).toBe(2);
      expect(result.affectedCounts[ENTITY_TYPES.JOB]).toBe(1);
      expect(result.affectedCounts[ENTITY_TYPES.DRIVER_PROFILE]).toBe(1);
      expect(result.totalAffected).toBe(4);

      // Verify listing update with all conditions including owner status
      expect(mockPrisma.listing.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['car-1', 'car-2'] },
          sellerId: 'user-123',
          hiddenByOwnerStatus: false,
          seller: {
            OR: [
              { status: { not: 'ACTIVE' } },
              { deletionScheduledAt: { not: null } },
            ],
          },
        },
        data: { hiddenByOwnerStatus: true },
      });

      // Verify outbox event created for indexed vertical with DELETE action
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledWith({
        data: [
          { entityType: ENTITY_TYPES.LISTING, entityId: 'car-1', action: 'DELETE' },
          { entityType: ENTITY_TYPES.LISTING, entityId: 'car-2', action: 'DELETE' },
        ],
      });

      // Verify outbox event NOT created for non-indexed vertical (DriverProfile)
      expect(mockPrisma.outboxEvent.createMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ entityType: ENTITY_TYPES.DRIVER_PROFILE }),
          ]),
        }),
      );

      // Verify redis delPattern called for listings
      expect(mockRedis.delPattern).toHaveBeenCalledWith('listings:*');
      expect(mockRedis.delPattern).toHaveBeenCalledWith('listing:*');
    });

    it('should be idempotent when no rows match (second run)', async () => {
      const result = await service.hideAllForUser('user-123');

      expect(result.totalAffected).toBe(0);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockRedis.delPattern).not.toHaveBeenCalled();
    });

    it('should re-check candidate ids inside transaction and skip outbox events if state changed concurrently', async () => {
      // Outer query finds car-1, but inner transaction re-check returns [] because status changed concurrently
      mockPrisma.listing.findMany
        .mockResolvedValueOnce([{ id: 'car-1' }])
        .mockResolvedValueOnce([]);

      const result = await service.hideAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.LISTING]).toBe(0);
      expect(mockPrisma.listing.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.outboxEvent.createMany).not.toHaveBeenCalled();
    });

    it('should no-op without outbox events on hide if owner became ACTIVE concurrently', async () => {
      // Outer read found car-1, but owner became ACTIVE so transaction re-check with { status: { not: 'ACTIVE' } } returns []
      mockPrisma.listing.findMany
        .mockResolvedValueOnce([{ id: 'car-1' }])
        .mockResolvedValueOnce([]);

      const result = await service.hideAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.LISTING]).toBe(0);
      expect(mockPrisma.listing.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.outboxEvent.createMany).not.toHaveBeenCalled();
    });

    it('should process in chunks of 500 when items exceed VISIBILITY_BATCH_CHUNK_SIZE', async () => {
      const chunk1 = Array.from({ length: 500 }, (_, i) => ({ id: `bus-${i}` }));
      const chunk2 = [{ id: 'bus-500' }, { id: 'bus-501' }];

      mockPrisma.busListing.findMany
        .mockResolvedValueOnce(chunk1) // outer read 1
        .mockResolvedValueOnce(chunk1) // inner read 1
        .mockResolvedValueOnce(chunk2) // outer read 2
        .mockResolvedValueOnce(chunk2); // inner read 2

      const result = await service.hideAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.BUS_LISTING]).toBe(502);
      expect(mockPrisma.busListing.findMany).toHaveBeenCalledTimes(4);
      expect(mockPrisma.busListing.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledTimes(2);
    });

    it('should hide content for an ACTIVE owner who has deletionScheduledAt set', async () => {
      mockPrisma.listing.findMany
        .mockResolvedValueOnce([{ id: 'car-sched-1' }])
        .mockResolvedValueOnce([{ id: 'car-sched-1' }]);

      const result = await service.hideAllForUser('user-sched-123');

      expect(result.affectedCounts[ENTITY_TYPES.LISTING]).toBe(1);
      expect(mockPrisma.listing.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['car-sched-1'] },
          sellerId: 'user-sched-123',
          hiddenByOwnerStatus: false,
          seller: {
            OR: [
              { status: { not: 'ACTIVE' } },
              { deletionScheduledAt: { not: null } },
            ],
          },
        },
        data: { hiddenByOwnerStatus: true },
      });
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledWith({
        data: [{ entityType: ENTITY_TYPES.LISTING, entityId: 'car-sched-1', action: 'DELETE' }],
      });
    });
  });

  describe('restoreAllForUser', () => {
    it('should find rows with hiddenByOwnerStatus: true, update to false, create UPSERT OutboxEvents, and clear Redis cache', async () => {
      mockPrisma.sparePart.findMany
        .mockResolvedValueOnce([{ id: 'part-1' }])
        .mockResolvedValueOnce([{ id: 'part-1' }]);

      mockPrisma.carService.findMany
        .mockResolvedValueOnce([{ id: 'srv-1' }])
        .mockResolvedValueOnce([{ id: 'srv-1' }]);

      const result = await service.restoreAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.SPARE_PART]).toBe(1);
      expect(result.affectedCounts[ENTITY_TYPES.CAR_SERVICE]).toBe(1);
      expect(result.totalAffected).toBe(2);

      // Verify update to false with all conditions including owner status
      expect(mockPrisma.sparePart.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['part-1'] },
          sellerId: 'user-123',
          hiddenByOwnerStatus: true,
          seller: { status: 'ACTIVE', deletionScheduledAt: null },
        },
        data: { hiddenByOwnerStatus: false },
      });

      // Verify outbox event with UPSERT
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledWith({
        data: [{ entityType: ENTITY_TYPES.SPARE_PART, entityId: 'part-1', action: 'UPSERT' }],
      });
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledWith({
        data: [{ entityType: ENTITY_TYPES.CAR_SERVICE, entityId: 'srv-1', action: 'UPSERT' }],
      });

      // Verify redis delPattern for carService
      expect(mockRedis.delPattern).toHaveBeenCalledWith('carService:list:*');
    });

    it('should no-op without outbox events on restore if owner became non-ACTIVE concurrently', async () => {
      // Outer query finds part-1, but inner transaction re-check returns [] because owner is no longer ACTIVE
      mockPrisma.sparePart.findMany
        .mockResolvedValueOnce([{ id: 'part-1' }])
        .mockResolvedValueOnce([]);

      const result = await service.restoreAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.SPARE_PART]).toBe(0);
      expect(mockPrisma.sparePart.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.outboxEvent.createMany).not.toHaveBeenCalled();
    });

    it('should skip restore and return empty result if user is scheduled for deletion (deletionScheduledAt != null)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      const result = await service.restoreAllForUser('user-scheduled-123');

      expect(result).toEqual({
        userId: 'user-scheduled-123',
        affectedCounts: {},
        totalAffected: 0,
      });
      expect(mockPrisma.listing.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.outboxEvent.createMany).not.toHaveBeenCalled();
    });
  });

  describe('Cross-vertical error isolation and aggregation', () => {
    it('should continue executing other verticals when one vertical fails, and throw VisibilityCrossVerticalError at end', async () => {
      mockPrisma.listing.findMany.mockRejectedValue(new Error('Postgres connection drop on listings'));
      mockPrisma.busListing.findMany
        .mockResolvedValueOnce([{ id: 'bus-1' }])
        .mockResolvedValueOnce([{ id: 'bus-1' }]);

      await expect(service.hideAllForUser('user-123')).rejects.toThrow(
        VisibilityCrossVerticalError,
      );

      // Bus listing was still processed despite listing failure
      expect(mockPrisma.busListing.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['bus-1'] },
          userId: 'user-123',
          hiddenByOwnerStatus: false,
          user: {
            OR: [
              { status: { not: 'ACTIVE' } },
              { deletionScheduledAt: { not: null } },
            ],
          },
        },
        data: { hiddenByOwnerStatus: true },
      });
    });
  });
});
