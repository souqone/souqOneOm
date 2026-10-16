import { Test, TestingModule } from '@nestjs/testing';
import {
  VisibilityReconciliationCron,
  RECONCILIATION_LOCK_KEY,
} from './visibility-reconciliation.cron';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OwnerContentVisibilityService } from '../services/owner-content-visibility.service';
import { OWNER_VISIBILITY_REGISTRY } from '../constants/owner-visibility.registry';

describe('VisibilityReconciliationCron', () => {
  let cron: VisibilityReconciliationCron;
  let mockPrisma: any;
  let mockRedis: any;
  let mockVisibilityService: any;

  beforeEach(async () => {
    mockRedis = {
      setNX: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockVisibilityService = {
      hideAllForUser: jest.fn().mockResolvedValue({ totalAffected: 1 }),
      restoreAllForUser: jest.fn().mockResolvedValue({ totalAffected: 1 }),
    };

    mockPrisma = {};
    for (const config of OWNER_VISIBILITY_REGISTRY) {
      mockPrisma[config.prismaDelegate] = {
        findMany: jest.fn().mockResolvedValue([]),
      };
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisibilityReconciliationCron,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: OwnerContentVisibilityService, useValue: mockVisibilityService },
      ],
    }).compile();

    cron = module.get<VisibilityReconciliationCron>(VisibilityReconciliationCron);
  });

  it('should skip execution if lock is not acquired', async () => {
    mockRedis.setNX.mockResolvedValueOnce(false);

    const result = await cron.reconcile();

    expect(result.skippedDueToLock).toBe(true);
    expect(mockPrisma.listing.findMany).not.toHaveBeenCalled();
    expect(mockVisibilityService.hideAllForUser).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('should acquire lock, reconcile misaligned owners, and release lock in finally', async () => {
    // Listing has owner-1 (sellerId) who should be hidden (banned/suspended)
    mockPrisma.listing.findMany.mockImplementation(async (args: any) => {
      if (args.where.hiddenByOwnerStatus === false) {
        return [{ sellerId: 'banned-seller-1' }];
      }
      return [];
    });

    // BusListing has owner-2 (userId) who should be restored (active)
    mockPrisma.busListing.findMany.mockImplementation(async (args: any) => {
      if (args.where.hiddenByOwnerStatus === true) {
        return [{ userId: 'active-user-2' }];
      }
      return [];
    });

    const result = await cron.reconcile();

    expect(result.hiddenOwnersCount).toBe(1);
    expect(result.restoredOwnersCount).toBe(1);

    expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('banned-seller-1');
    expect(mockVisibilityService.restoreAllForUser).toHaveBeenCalledWith('active-user-2');

    expect(mockRedis.setNX).toHaveBeenCalledWith(RECONCILIATION_LOCK_KEY, 'locked', 240);
    expect(mockRedis.del).toHaveBeenCalledWith(RECONCILIATION_LOCK_KEY);
  });

  it('should always release lock even if an unexpected error occurs during reconciliation', async () => {
    mockPrisma.listing.findMany.mockRejectedValueOnce(new Error('Fatal DB crash'));

    await expect(cron.reconcile()).rejects.toThrow('Fatal DB crash');

    expect(mockRedis.del).toHaveBeenCalledWith(RECONCILIATION_LOCK_KEY);
  });
});
