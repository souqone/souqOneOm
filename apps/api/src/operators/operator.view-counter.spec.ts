import { Test, TestingModule } from '@nestjs/testing';
import {
  OperatorViewCounterService,
  OPERATOR_VIEW_LOCK_KEY,
  OPERATOR_VIEW_LOCK_TTL_SECONDS,
  OPERATOR_VIEW_DIRTY_SET,
  OPERATOR_VIEW_COUNT_PREFIX,
  OPERATOR_VIEW_DEDUPE_PREFIX,
  OPERATOR_VIEW_COOLDOWN_SECONDS,
  OPERATOR_VIEW_FLUSH_BATCH_CAP,
} from './operator-view-counter.service';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OperatorViewCounterService', () => {
  let service: OperatorViewCounterService;
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
      eval: jest.fn().mockResolvedValue(1),
    };

    redisMock = {
      isReady: jest.fn().mockReturnValue(true),
      setNX: jest.fn().mockResolvedValue(true),
      getClient: jest.fn().mockReturnValue(mockClient),
      incr: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(undefined),
    };

    prismaMock = {
      operatorListing: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorViewCounterService,
        { provide: RedisService, useValue: redisMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OperatorViewCounterService>(OperatorViewCounterService);
  });

  describe('1. Viewer Identity & Deduplication Rules', () => {
    it('counts view for logged-in viewer keyed by user id', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
        viewerIp: '192.168.1.1',
      });

      expect(recorded).toBe(true);
      expect(redisMock.setNX).toHaveBeenCalledWith(
        `${OPERATOR_VIEW_DEDUPE_PREFIX}op-1:user-1`,
        '1',
        OPERATOR_VIEW_COOLDOWN_SECONDS,
      );
      expect(mockClient.sadd).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-1');
      expect(mockClient.incr).toHaveBeenCalledWith(`${OPERATOR_VIEW_COUNT_PREFIX}op-1`);
    });

    it('same viewer twice within the hour is counted once (dedupe active)', async () => {
      redisMock.setNX.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const first = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
      });
      const second = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
      });

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(mockClient.incr).toHaveBeenCalledTimes(1);
    });

    it('two different viewers are counted twice', async () => {
      redisMock.setNX.mockResolvedValue(true);

      const viewerA = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-A',
      });
      const viewerB = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-B',
      });

      expect(viewerA).toBe(true);
      expect(viewerB).toBe(true);
      expect(mockClient.incr).toHaveBeenCalledTimes(2);
    });

    it('anonymous viewer is keyed by IP and counts separately for different IPs', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: null,
        viewerIp: '203.0.113.195',
      });

      expect(recorded).toBe(true);
      expect(redisMock.setNX).toHaveBeenCalledWith(
        `${OPERATOR_VIEW_DEDUPE_PREFIX}op-1:203.0.113.195`,
        '1',
        OPERATOR_VIEW_COOLDOWN_SECONDS,
      );
    });

    it('does NOT count when viewer is the listing owner', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'owner-99',
        viewerIp: '127.0.0.1',
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
      expect(mockClient.incr).not.toHaveBeenCalled();
    });

    it('does NOT count when neither viewerId nor viewerIp is provided', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: null,
        viewerIp: null,
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });
  });

  describe('2. Visibility & Gate Status Checks', () => {
    it('does NOT count for inactive listing status (e.g. DRAFT or PENDING)', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'DRAFT',
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('does NOT count for listing hidden by owner status', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        hiddenByOwnerStatus: true,
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('does NOT count for soft-deleted listing if deletedAt is set', async () => {
      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        deletedAt: new Date(),
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });
  });

  describe('3. Resilience & Fail-Open Behavior', () => {
    it('skips counting without throwing when Redis is not ready', async () => {
      redisMock.isReady.mockReturnValue(false);

      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
      expect(redisMock.setNX).not.toHaveBeenCalled();
    });

    it('swallows errors and returns false if Redis throws on setNX', async () => {
      redisMock.setNX.mockRejectedValue(new Error('Redis timeout'));

      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
    });

    it('swallows errors and returns false if Redis client throws on incr/sadd', async () => {
      mockClient.sadd.mockRejectedValue(new Error('OOM command not allowed'));

      const recorded = await service.recordView({
        listingId: 'op-1',
        ownerId: 'owner-99',
        status: 'ACTIVE',
        viewerId: 'user-1',
      });

      expect(recorded).toBe(false);
    });
  });

  describe('4. Periodic Flush (@Cron) & Database Persistence', () => {
    it('acquires distributed lock with random token and releases safely via Lua script', async () => {
      const result = await service.flushViews();

      expect(redisMock.setNX).toHaveBeenCalledWith(
        OPERATOR_VIEW_LOCK_KEY,
        expect.any(String),
        OPERATOR_VIEW_LOCK_TTL_SECONDS,
      );
      expect(result.skippedDueToLock).toBeUndefined();
      expect(mockClient.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('GET', KEYS[1]) == ARGV[1]"),
        1,
        OPERATOR_VIEW_LOCK_KEY,
        expect.any(String),
      );
    });

    it('skips flush if distributed lock is already held by another replica', async () => {
      redisMock.setNX.mockResolvedValue(false);

      const result = await service.flushViews();

      expect(result.skippedDueToLock).toBe(true);
      expect(result.flushedCount).toBe(0);
      expect(prismaMock.operatorListing.updateMany).not.toHaveBeenCalled();
    });

    it('flushes delta to DB via updateMany, SREMs id on remaining<=0, re-checks count and keeps key', async () => {
      mockClient.smembers.mockResolvedValue(['op-10', 'op-20']);
      mockClient.get.mockImplementation((k: string) => {
        if (k.endsWith('op-10')) return Promise.resolve('12');
        if (k.endsWith('op-20')) return Promise.resolve('8');
        return Promise.resolve('0');
      });
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(2);
      expect(result.failedCount).toBe(0);

      expect(prismaMock.operatorListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'op-10' },
        data: { viewCount: { increment: 12 } },
      });
      expect(prismaMock.operatorListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'op-20' },
        data: { viewCount: { increment: 8 } },
      });

      expect(mockClient.decrby).toHaveBeenCalledWith(`${OPERATOR_VIEW_COUNT_PREFIX}op-10`, 12);
      expect(mockClient.decrby).toHaveBeenCalledWith(`${OPERATOR_VIEW_COUNT_PREFIX}op-20`, 8);
      expect(mockClient.srem).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-10');
      expect(mockClient.srem).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-20');
    });

    it('re-adds id to dirty set if new views arrived after decrby when count was 0', async () => {
      mockClient.smembers.mockResolvedValue(['op-race']);
      mockClient.get
        .mockResolvedValueOnce('5') // first read
        .mockResolvedValueOnce('2'); // post-SREM re-check sees new views arrived
      mockClient.decrby.mockResolvedValue(0);

      await service.flushViews();

      expect(mockClient.srem).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-race');
      expect(mockClient.sadd).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-race');
    });

    it('zero-delta branch: re-adds id to dirty set when post-SREM re-check returns > 0', async () => {
      mockClient.smembers.mockResolvedValue(['op-zero']);
      mockClient.get
        .mockResolvedValueOnce('0') // initial read is 0
        .mockResolvedValueOnce('3'); // post-SREM re-check shows new view arrived

      await service.flushViews();

      expect(mockClient.srem).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-zero');
      expect(mockClient.sadd).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-zero');
      expect(prismaMock.operatorListing.updateMany).not.toHaveBeenCalled();
    });

    it('zero-delta branch: does NOT re-add id to dirty set when post-SREM re-check returns 0', async () => {
      mockClient.smembers.mockResolvedValue(['op-zero-clean']);
      mockClient.get
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce('0');

      await service.flushViews();

      expect(mockClient.srem).toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-zero-clean');
      expect(mockClient.sadd).not.toHaveBeenCalledWith(OPERATOR_VIEW_DIRTY_SET, 'op-zero-clean');
      expect(prismaMock.operatorListing.updateMany).not.toHaveBeenCalled();
    });

    it('handles DECRBY failure gracefully without failing the cron run (logs error)', async () => {
      mockClient.smembers.mockResolvedValue(['op-decr-fail']);
      mockClient.get.mockResolvedValue('8');
      mockClient.decrby.mockRejectedValue(new Error('Redis connection reset during DECRBY'));

      const result = await service.flushViews();

      expect(prismaMock.operatorListing.updateMany).toHaveBeenCalledWith({
        where: { id: 'op-decr-fail' },
        data: { viewCount: { increment: 8 } },
      });
      expect(result.flushedCount).toBe(1);
      expect(result.failedCount).toBe(0);
    });

    it('keeps delta in Redis and dirty set on DB error to retry next minute', async () => {
      mockClient.smembers.mockResolvedValue(['op-fail']);
      mockClient.get.mockResolvedValue('5');
      prismaMock.operatorListing.updateMany.mockRejectedValue(new Error('DB deadlocked'));

      const result = await service.flushViews();

      expect(result.failedCount).toBe(1);
      expect(result.flushedCount).toBe(0);
      expect(mockClient.decrby).not.toHaveBeenCalled();
      expect(mockClient.srem).not.toHaveBeenCalled();
    });

    it('caps processed IDs per flush run to OPERATOR_VIEW_FLUSH_BATCH_CAP', async () => {
      const manyIds = Array.from({ length: 600 }, (_, i) => `op-${i}`);
      mockClient.smembers.mockResolvedValue(manyIds);
      mockClient.get.mockResolvedValue('1');
      mockClient.decrby.mockResolvedValue(0);

      const result = await service.flushViews();

      expect(result.flushedCount).toBe(OPERATOR_VIEW_FLUSH_BATCH_CAP);
      expect(prismaMock.operatorListing.updateMany).toHaveBeenCalledTimes(OPERATOR_VIEW_FLUSH_BATCH_CAP);
    });
  });
});
