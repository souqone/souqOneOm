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
      isReady: jest.fn().mockReturnValue(true),
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

  it('Case 1 (Redis not ready): should proceed without lock and NOT release lock in finally when redis.isReady() is false', async () => {
    mockRedis.isReady.mockReturnValue(false);

    const result = await cron.reconcile();

    expect(result.skippedDueToLock).toBeUndefined();
    expect(mockRedis.setNX).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
    expect(mockPrisma.listing.findMany).toHaveBeenCalled();
  });

  it('Case 2 (Redis ready, lock taken): should skip execution when redis is ready but setNX returns false', async () => {
    mockRedis.isReady.mockReturnValue(true);
    mockRedis.setNX.mockResolvedValueOnce(false);

    const result = await cron.reconcile();

    expect(result.skippedDueToLock).toBe(true);
    expect(mockRedis.setNX).toHaveBeenCalledWith(RECONCILIATION_LOCK_KEY, 'locked', 240);
    expect(mockPrisma.listing.findMany).not.toHaveBeenCalled();
    expect(mockVisibilityService.hideAllForUser).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('Case 3 (Redis ready, lock available): should acquire lock, execute scan, and release lock in finally', async () => {
    mockRedis.isReady.mockReturnValue(true);
    mockRedis.setNX.mockResolvedValueOnce(true);

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

  it('should always release lock even if an unexpected error occurs during reconciliation when lock was acquired', async () => {
    mockRedis.isReady.mockReturnValue(true);
    mockRedis.setNX.mockResolvedValueOnce(true);
    mockPrisma.listing.findMany.mockRejectedValueOnce(new Error('Fatal DB crash'));

    await expect(cron.reconcile()).rejects.toThrow('Fatal DB crash');

    expect(mockRedis.del).toHaveBeenCalledWith(RECONCILIATION_LOCK_KEY);
  });

  it('Scan A considers scheduled user "must hide" and Scan B excludes scheduled users from restoration', async () => {
    mockRedis.isReady.mockReturnValue(true);
    mockRedis.setNX.mockResolvedValueOnce(true);

    const capturedWhereQueries: any[] = [];

    mockPrisma.listing.findMany.mockImplementation(async (args: any) => {
      capturedWhereQueries.push(args.where);
      if (args.where.hiddenByOwnerStatus === false) {
        // Scheduled user found unhidden in Scan A
        return [{ sellerId: 'scheduled-active-user' }];
      }
      return [];
    });

    const result = await cron.reconcile();

    // Verify Scan A query structure includes OR with deletionScheduledAt
    const scanAQuery = capturedWhereQueries.find((q) => q.hiddenByOwnerStatus === false);
    expect(scanAQuery.seller).toEqual({
      OR: [
        { status: { not: 'ACTIVE' } },
        { deletionScheduledAt: { not: null } },
      ],
    });

    // Verify Scan B query structure requires deletionScheduledAt: null alongside ACTIVE status
    const scanBQuery = capturedWhereQueries.find((q) => q.hiddenByOwnerStatus === true);
    expect(scanBQuery.seller).toEqual({
      status: 'ACTIVE',
      deletionScheduledAt: null,
    });

    // Scheduled user was queued for hide, never for restore
    expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('scheduled-active-user');
    expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalledWith('scheduled-active-user');
    expect(result.hiddenOwnersCount).toBe(1);
    expect(result.restoredOwnersCount).toBe(0);
  });
});
