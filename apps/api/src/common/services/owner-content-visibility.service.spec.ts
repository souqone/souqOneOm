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
      outboxEvent: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    for (const config of OWNER_VISIBILITY_REGISTRY) {
      mockPrisma[config.prismaDelegate] = {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
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
      mockPrisma.listing.findMany.mockResolvedValueOnce([{ id: 'car-1' }, { id: 'car-2' }]);
      mockPrisma.driverJob.findMany.mockResolvedValueOnce([{ id: 'job-1' }]);
      mockPrisma.driverProfile.findMany.mockResolvedValueOnce([{ id: 'prof-1' }]);

      const result = await service.hideAllForUser('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.affectedCounts[ENTITY_TYPES.LISTING]).toBe(2);
      expect(result.affectedCounts[ENTITY_TYPES.JOB]).toBe(1);
      expect(result.affectedCounts[ENTITY_TYPES.DRIVER_PROFILE]).toBe(1);
      expect(result.totalAffected).toBe(4);

      // Verify listing update
      expect(mockPrisma.listing.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['car-1', 'car-2'] } },
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

    it('should process in chunks of 500 when items exceed VISIBILITY_BATCH_CHUNK_SIZE', async () => {
      const chunk1 = Array.from({ length: 500 }, (_, i) => ({ id: `bus-${i}` }));
      const chunk2 = [{ id: 'bus-500' }, { id: 'bus-501' }];

      mockPrisma.busListing.findMany
        .mockResolvedValueOnce(chunk1)
        .mockResolvedValueOnce(chunk2);

      const result = await service.hideAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.BUS_LISTING]).toBe(502);
      expect(mockPrisma.busListing.findMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.busListing.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.outboxEvent.createMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('restoreAllForUser', () => {
    it('should find rows with hiddenByOwnerStatus: true, update to false, create UPSERT OutboxEvents, and clear Redis cache', async () => {
      mockPrisma.sparePart.findMany.mockResolvedValueOnce([{ id: 'part-1' }]);
      mockPrisma.carService.findMany.mockResolvedValueOnce([{ id: 'srv-1' }]);

      const result = await service.restoreAllForUser('user-123');

      expect(result.affectedCounts[ENTITY_TYPES.SPARE_PART]).toBe(1);
      expect(result.affectedCounts[ENTITY_TYPES.CAR_SERVICE]).toBe(1);
      expect(result.totalAffected).toBe(2);

      // Verify update to false
      expect(mockPrisma.sparePart.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['part-1'] } },
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
  });

  describe('Cross-vertical error isolation and aggregation', () => {
    it('should continue executing other verticals when one vertical fails, and throw VisibilityCrossVerticalError at end', async () => {
      mockPrisma.listing.findMany.mockRejectedValue(new Error('Postgres connection drop on listings'));
      mockPrisma.busListing.findMany.mockResolvedValueOnce([{ id: 'bus-1' }]);

      await expect(service.hideAllForUser('user-123')).rejects.toThrow(
        VisibilityCrossVerticalError,
      );

      // Bus listing was still processed despite listing failure
      expect(mockPrisma.busListing.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['bus-1'] } },
        data: { hiddenByOwnerStatus: true },
      });
    });
  });
});
