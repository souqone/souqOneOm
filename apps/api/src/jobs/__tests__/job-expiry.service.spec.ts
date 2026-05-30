import { Test, TestingModule } from '@nestjs/testing';
import { JobExpiryService } from '../job-expiry.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SearchService } from '../../search/search.service';
import { NotificationsService } from '../../notifications/notifications.service';

const mockPrisma: any = {
  driverJob: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  jobApplication: {
    updateMany: jest.fn(),
  },
};

const mockRedis = {
  setNX: jest.fn(),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
};

const mockSearch = {
  removeDocument: jest.fn().mockResolvedValue(undefined),
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue(undefined),
};

describe('JobExpiryService', () => {
  let service: JobExpiryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobExpiryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: SearchService, useValue: mockSearch },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<JobExpiryService>(JobExpiryService);
  });

  // ─── C-3: Distributed lock ───
  describe('expireOldJobs — distributed lock (C-3)', () => {
    it('should skip entirely when the Redis lock is already held by another instance', async () => {
      mockRedis.setNX.mockResolvedValue(false);

      await service.expireOldJobs();

      expect(mockPrisma.driverJob.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.jobApplication.updateMany).not.toHaveBeenCalled();
    });

    it('should acquire the lock with a 300-second TTL, run, then release it', async () => {
      mockRedis.setNX.mockResolvedValue(true);
      mockPrisma.driverJob.findMany.mockResolvedValue([]); // nothing to expire

      await service.expireOldJobs();

      expect(mockRedis.setNX).toHaveBeenCalledWith('cron:jobs:expiry', '1', 300);
      expect(mockRedis.del).toHaveBeenCalledWith('cron:jobs:expiry');
    });

    it('should release the lock even when runExpiry throws (finally block)', async () => {
      mockRedis.setNX.mockResolvedValue(true);
      mockPrisma.driverJob.findMany.mockRejectedValue(new Error('DB timeout'));

      await expect(service.expireOldJobs()).rejects.toThrow('DB timeout');

      expect(mockRedis.del).toHaveBeenCalledWith('cron:jobs:expiry');
    });

    it('should ensure only one instance runs when two fire concurrently (Expiry Cron Duplicate Execution Test)', async () => {
      mockRedis.setNX
        .mockResolvedValueOnce(true)   // first call acquires the lock
        .mockResolvedValueOnce(false); // second concurrent call: lock already held
      mockPrisma.driverJob.findMany.mockResolvedValue([]);

      await Promise.all([service.expireOldJobs(), service.expireOldJobs()]);

      expect(mockPrisma.driverJob.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Core expiry logic ───
  describe('runExpiry', () => {
    const expiredJobs = [
      { id: 'j1', slug: 'job-1', userId: 'u1', title: 'سائق مطلوب' },
      { id: 'j2', slug: null,    userId: 'u2', title: 'توصيل مطلوب' },
    ];

    beforeEach(() => {
      mockRedis.setNX.mockResolvedValue(true); // lock always acquired
      mockPrisma.driverJob.findMany.mockResolvedValue(expiredJobs);
      mockPrisma.driverJob.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 3 });
    });

    it('should be a no-op when no jobs are older than 30 days', async () => {
      mockPrisma.driverJob.findMany.mockResolvedValue([]);

      await service.expireOldJobs();

      expect(mockPrisma.driverJob.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.jobApplication.updateMany).not.toHaveBeenCalled();
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('should auto-reject PENDING applications for all expired jobs (M-1 / Job Close Auto-Reject Test)', async () => {
      await service.expireOldJobs();

      expect(mockPrisma.jobApplication.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: { in: ['j1', 'j2'] },
            status: 'PENDING',
          }),
          data: { status: 'REJECTED' },
        }),
      );
    });

    it('should notify each job owner on expiry (NOTIF-1)', async () => {
      await service.expireOldJobs();

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', title: 'انتهت صلاحية وظيفتك' }),
      );
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u2', title: 'انتهت صلاحية وظيفتك' }),
      );
    });

    it('should remove all expired jobs from Meilisearch (SEARCH-1)', async () => {
      await service.expireOldJobs();

      expect(mockSearch.removeDocument).toHaveBeenCalledTimes(2);
      expect(mockSearch.removeDocument).toHaveBeenCalledWith(expect.any(String), 'j1');
      expect(mockSearch.removeDocument).toHaveBeenCalledWith(expect.any(String), 'j2');
    });

    it('should continue normally when a notification fails (Apply Notification Failure Test)', async () => {
      mockNotifications.create
        .mockResolvedValueOnce(undefined)             // u1 succeeds
        .mockRejectedValueOnce(new Error('timeout')); // u2 fails

      // Promise.allSettled absorbs the rejection — expireOldJobs must not throw
      await expect(service.expireOldJobs()).resolves.not.toThrow();
      // DB write still ran
      expect(mockPrisma.jobApplication.updateMany).toHaveBeenCalled();
    });
  });
});
