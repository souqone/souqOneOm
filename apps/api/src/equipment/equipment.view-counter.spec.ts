import { Test, TestingModule } from '@nestjs/testing';
import {
  EquipmentViewCounterService,
  EQUIPMENT_VIEW_LOCK_KEY,
  EQUIPMENT_VIEW_LOCK_TTL_SECONDS,
  EQUIPMENT_VIEW_DIRTY_SET,
  EQUIPMENT_VIEW_COUNT_PREFIX,
  EQUIPMENT_VIEW_DEDUPE_PREFIX,
  EQUIPMENT_VIEW_COOLDOWN_SECONDS,
  EQUIPMENT_VIEW_FLUSH_BATCH_CAP,
} from './equipment-view-counter.service';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EquipmentViewCounterService (Task EB5)', () => {
  let service: EquipmentViewCounterService;
  let redisMock: any;
  let prismaMock: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      incr: jest.fn().mockResolvedValue(1),
      decrby: jest.fn().mockResolvedValue(0),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      srem: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(1),
    };

    redisMock = {
      isReady: jest.fn().mockReturnValue(true),
      setNX: jest.fn().mockResolvedValue(true),
      getClient: jest.fn().mockReturnValue(mockClient),
      incr: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(undefined),
    };

    prismaMock = {
      equipmentListing: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentViewCounterService,
        { provide: RedisService, useValue: redisMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EquipmentViewCounterService>(EquipmentViewCounterService);
  });

  describe('1. Viewer Identity & Deduplication Rules', () => {
    it('counts view for logged-in viewer keyed by user id', async () => {
      const recorded = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
        viewerIp: '192.168.1.1',
      });

      expect(recorded).toBe(true);
      expect(redisMock.setNX).toHaveBeenCalledWith(
        `${EQUIPMENT_VIEW_DEDUPE_PREFIX}eq-1:user-1`,
        '1',
        EQUIPMENT_VIEW_COOLDOWN_SECONDS,
      );
      expect(mockClient.incr).toHaveBeenCalledWith(`${EQUIPMENT_VIEW_COUNT_PREFIX}eq-1`);
      expect(mockClient.sadd).toHaveBeenCalledWith(EQUIPMENT_VIEW_DIRTY_SET, 'eq-1');
    });

    it('same logged-in user from a different IP within TTL does not count (cooldown active)', async () => {
      // First view
      redisMock.setNX.mockResolvedValueOnce(true);
      const first = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
        viewerIp: '10.0.0.1',
      });
      expect(first).toBe(true);

      // Second view from different IP within 1 hour
      redisMock.setNX.mockResolvedValueOnce(false);
      const second = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
        viewerIp: '10.0.0.2',
      });
      expect(second).toBe(false);
      expect(mockClient.incr).toHaveBeenCalledTimes(1);
    });

    it('anonymous viewer is keyed by IP and counts separately for different IPs', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      const ip1 = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerIp: '203.0.113.10',
      });
      expect(ip1).toBe(true);
      expect(redisMock.setNX).toHaveBeenCalledWith(
        `${EQUIPMENT_VIEW_DEDUPE_PREFIX}eq-1:203.0.113.10`,
        '1',
        EQUIPMENT_VIEW_COOLDOWN_SECONDS,
      );

      redisMock.setNX.mockResolvedValueOnce(true);
      const ip2 = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerIp: '203.0.113.20',
      });
      expect(ip2).toBe(true);
      expect(redisMock.setNX).toHaveBeenCalledWith(
        `${EQUIPMENT_VIEW_DEDUPE_PREFIX}eq-1:203.0.113.20`,
        '1',
        EQUIPMENT_VIEW_COOLDOWN_SECONDS,
      );
      expect(mockClient.incr).toHaveBeenCalledTimes(2);
    });

    it('second view from same anonymous IP within TTL is not counted', async () => {
      redisMock.setNX.mockResolvedValueOnce(false);
      const repeated = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerIp: '203.0.113.10',
      });
      expect(repeated).toBe(false);
      expect(mockClient.incr).not.toHaveBeenCalled();
    });

    it('does NOT count when viewer is the listing owner', async () => {
      const ownerView = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-1',
        status: 'ACTIVE',
        viewerId: 'owner-1',
        viewerIp: '192.168.1.1',
      });

      expect(ownerView).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
      expect(mockClient.incr).not.toHaveBeenCalled();
    });

    it('does NOT count when neither viewerId nor viewerIp is provided', async () => {
      const noIdentity = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-1',
        status: 'ACTIVE',
        viewerId: null,
        viewerIp: null,
      });

      expect(noIdentity).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
      expect(mockClient.incr).not.toHaveBeenCalled();
    });
  });

  describe('2. Visibility & Gate Status Checks', () => {
    it('does NOT count for inactive listing status (e.g. DRAFT)', async () => {
      const draft = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'DRAFT',
        viewerId: 'user-2',
      });
      expect(draft).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('does NOT count for soft-deleted listing (deletedAt != null)', async () => {
      const deleted = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        deletedAt: new Date(),
        viewerId: 'user-2',
      });
      expect(deleted).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('does NOT count for listing hidden by owner status (hiddenByOwnerStatus === true)', async () => {
      const hidden = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        hiddenByOwnerStatus: true,
        viewerId: 'user-2',
      });
      expect(hidden).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });
  });

  describe('3. Resilience & Fail-Open Behavior', () => {
    it('skips counting without throwing when Redis is not ready', async () => {
      redisMock.isReady.mockReturnValue(false);

      const res = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-2',
      });

      expect(res).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('swallows errors and returns false if Redis throws on setNX', async () => {
      redisMock.setNX.mockRejectedValue(new Error('Redis connection lost'));

      const res = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-2',
      });

      expect(res).toBe(false);
    });

    it('swallows errors and returns false if Redis client throws on incr/sadd', async () => {
      mockClient.incr.mockRejectedValue(new Error('Redis cluster unreachable'));

      const res = await service.recordView({
        listingId: 'eq-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-2',
      });

      expect(res).toBe(false);
    });
  });

  describe('4. Periodic Flush (@Cron) & Concurrency Control', () => {
    it('acquires distributed lock with 55s TTL and releases it after flush', async () => {
      redisMock.setNX.mockResolvedValueOnce(true); // Lock acquired
      mockClient.smembers.mockResolvedValue(['eq-1']);
      mockClient.get.mockResolvedValue('5');
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.skippedDueToLock).toBeUndefined();
      expect(redisMock.setNX).toHaveBeenCalledWith(
        EQUIPMENT_VIEW_LOCK_KEY,
        'locked',
        EQUIPMENT_VIEW_LOCK_TTL_SECONDS,
      );
      expect(redisMock.del).toHaveBeenCalledWith(EQUIPMENT_VIEW_LOCK_KEY);
      expect(result.flushedCount).toBe(1);
    });

    it('skips flush if distributed lock is already held by another replica', async () => {
      redisMock.setNX.mockResolvedValueOnce(false); // Lock not acquired

      const result = await service.flushViews();

      expect(result.skippedDueToLock).toBe(true);
      expect(result.flushedCount).toBe(0);
      expect(mockClient.smembers).not.toHaveBeenCalled();
      expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('flushes delta to DB via updateMany and subtracts flushed delta with DECRBY', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      mockClient.smembers.mockResolvedValue(['eq-10']);
      mockClient.get.mockResolvedValue('12');
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(1);
      expect(prismaMock.equipmentListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'eq-10' },
        data: { viewCount: { increment: 12 } },
      });
      expect(mockClient.decrby).toHaveBeenCalledWith(`${EQUIPMENT_VIEW_COUNT_PREFIX}eq-10`, 12);
      expect(mockClient.del).toHaveBeenCalledWith(`${EQUIPMENT_VIEW_COUNT_PREFIX}eq-10`);
      expect(mockClient.srem).toHaveBeenCalledWith(EQUIPMENT_VIEW_DIRTY_SET, 'eq-10');
    });

    it('keeps remaining delta in dirty set when views arrive during DB write (decrby > 0)', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      mockClient.smembers.mockResolvedValue(['eq-20']);
      mockClient.get.mockResolvedValue('10');
      // 3 more views arrived during DB write, so decrby(10) leaves 3
      mockClient.decrby.mockResolvedValue(3);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(1);
      expect(prismaMock.equipmentListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'eq-20' },
        data: { viewCount: { increment: 10 } },
      });
      expect(mockClient.decrby).toHaveBeenCalledWith(`${EQUIPMENT_VIEW_COUNT_PREFIX}eq-20`, 10);
      // DEL and SREM must NOT be called for eq-20 because 3 views are still pending
      expect(mockClient.del).not.toHaveBeenCalledWith(`${EQUIPMENT_VIEW_COUNT_PREFIX}eq-20`);
      expect(mockClient.srem).not.toHaveBeenCalledWith(EQUIPMENT_VIEW_DIRTY_SET, 'eq-20');
    });

    it('keeps delta in Redis and dirty set on DB error to retry next minute', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      mockClient.smembers.mockResolvedValue(['eq-fail']);
      mockClient.get.mockResolvedValue('7');
      prismaMock.equipmentListing.updateMany.mockRejectedValue(new Error('DB deadlocked'));

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      // decrby, del, and srem must NOT be called on failure
      expect(mockClient.decrby).not.toHaveBeenCalled();
      expect(mockClient.srem).not.toHaveBeenCalledWith(EQUIPMENT_VIEW_DIRTY_SET, 'eq-fail');
    });

    it('handles missing listing row safely without throwing (updateMany returns count 0)', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      mockClient.smembers.mockResolvedValue(['eq-missing']);
      mockClient.get.mockResolvedValue('4');
      prismaMock.equipmentListing.updateMany.mockResolvedValue({ count: 0 });
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(1);
      expect(mockClient.srem).toHaveBeenCalledWith(EQUIPMENT_VIEW_DIRTY_SET, 'eq-missing');
    });

    it('caps processed IDs per flush run to EQUIPMENT_VIEW_FLUSH_BATCH_CAP', async () => {
      redisMock.setNX.mockResolvedValueOnce(true);
      const manyIds = Array.from({ length: 600 }, (_, i) => `eq-${i}`);
      mockClient.smembers.mockResolvedValue(manyIds);
      mockClient.get.mockResolvedValue('1');
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(EQUIPMENT_VIEW_FLUSH_BATCH_CAP);
      expect(prismaMock.equipmentListing.updateMany).toHaveBeenCalledTimes(EQUIPMENT_VIEW_FLUSH_BATCH_CAP);
    });
  });
});
