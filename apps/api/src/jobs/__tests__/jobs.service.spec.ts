import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from '../jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SearchService } from '../../search/search.service';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';

// ── Mocks ──
const mockPrisma: any = {
  driverJob: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobApplication: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  // AUTH-1: profile type lookups
  driverProfile: { findUnique: jest.fn() },
  employerProfile: { findUnique: jest.fn() },
  cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
  // C-1: transaction support for CAS writes
  $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) => fn(mockPrisma)),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incr: jest.fn().mockResolvedValue(1),
  setNX: jest.fn().mockResolvedValue(true), // L-1: atomic view-count dedup
  getTTL: jest.fn().mockResolvedValue(-1),
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue(undefined),
};

const mockSearch = {
  indexDocument: jest.fn().mockResolvedValue(undefined),
  removeDocument: jest.fn().mockResolvedValue(undefined),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: SearchService, useValue: mockSearch },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  // ─── findAll ───
  describe('findAll', () => {
    it('should return paginated jobs', async () => {
      const mockItems = [{ id: '1', title: 'Driver needed', status: 'ACTIVE' }];
      mockPrisma.driverJob.findMany.mockResolvedValue(mockItems);
      mockPrisma.driverJob.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' } as any);

      expect(result.items).toEqual(mockItems);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('should return cached results when available', async () => {
      const cached = { items: [{ id: 'cached' }], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };
      mockRedis.get.mockResolvedValueOnce(cached);

      const result = await service.findAll({} as any);

      expect(result).toEqual(cached);
      expect(mockPrisma.driverJob.findMany).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ───
  describe('findOne', () => {
    it('should return a job by id', async () => {
      const mockJob = { id: '1', title: 'Test Job', status: 'ACTIVE' };
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);

      const result = await service.findOne('1');

      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───
  describe('update', () => {
    const mockJob = { id: '1', userId: 'user1', status: 'ACTIVE', slug: 'test-job', minAge: null, maxAge: null };

    it('should allow status change ACTIVE → CLOSED', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.driverJob.update.mockResolvedValue({ ...mockJob, status: 'CLOSED' });
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      const result = await service.update('1', 'user1', { status: 'CLOSED' } as any);

      expect(result.status).toBe('CLOSED');
    });

    it('should reject re-opening a CLOSED job (AUTH-2)', async () => {
      const closedJob = { ...mockJob, status: 'CLOSED' };
      mockPrisma.driverJob.findUnique.mockResolvedValue(closedJob);

      await expect(
        service.update('1', 'user1', { status: 'ACTIVE' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject status change to EXPIRED (AUTH-2)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.update('1', 'user1', { status: 'EXPIRED' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject re-activating an EXPIRED job (AUTH-2)', async () => {
      const expiredJob = { ...mockJob, status: 'EXPIRED' };
      mockPrisma.driverJob.findUnique.mockResolvedValue(expiredJob);

      await expect(
        service.update('1', 'user1', { status: 'ACTIVE' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.update('1', 'other-user', { status: 'CLOSED' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject minAge >= maxAge (BL-4)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.update('1', 'user1', { minAge: 50, maxAge: 30 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-reject PENDING applications and notify applicants when closing job (M-1)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.driverJob.update.mockResolvedValue({ ...mockJob, status: 'CLOSED' });
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { applicantId: 'a1' },
        { applicantId: 'a2' },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 2 });

      await service.update('1', 'user1', { status: 'CLOSED' } as any);

      expect(mockPrisma.jobApplication.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
          data: { status: 'REJECTED' },
        }),
      );
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });
  });

  // ─── apply ───
  describe('apply', () => {
    const mockJob = { id: 'job1', userId: 'owner1', status: 'ACTIVE', title: 'Driver needed', jobType: 'HIRING' };

    it('should create an application', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
      // AUTH-1: applicant has DriverProfile for HIRING job
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1' });
      mockPrisma.jobApplication.create.mockResolvedValue({
        id: 'app1',
        status: 'PENDING',
        applicantId: 'applicant1',
        applicant: { id: 'applicant1', username: 'driver', displayName: 'Driver' },
      });

      const result = await service.apply('job1', 'applicant1', { message: 'Interested' } as any);

      expect(result.status).toBe('PENDING');
      expect(mockNotifications.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when applicant lacks required profile (AUTH-1)', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null); // no DriverProfile

      await expect(
        service.apply('job1', 'applicant1', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for duplicate application', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1' });
      mockPrisma.jobApplication.create.mockRejectedValue({ code: 'P2002', meta: { target: ['jobId_applicantId'] } });

      await expect(
        service.apply('job1', 'applicant1', {} as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for self-application', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);

      await expect(
        service.apply('job1', 'owner1', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for closed job', async () => {
      const closedJob = { ...mockJob, status: 'CLOSED' };
      mockPrisma.driverJob.findFirst.mockResolvedValue(closedJob);

      await expect(
        service.apply('job1', 'applicant1', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should succeed even when notification service throws (C-4)', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1' });
      mockPrisma.jobApplication.create.mockResolvedValue({
        id: 'app1',
        status: 'PENDING',
        applicantId: 'applicant1',
        applicant: { id: 'applicant1', username: 'driver', displayName: 'Driver', avatarUrl: null, isVerified: false },
      });
      mockNotifications.create.mockRejectedValueOnce(new Error('Notification service down'));

      const result = await service.apply('job1', 'applicant1', { message: 'Interested' } as any);

      // Application was persisted — fire-and-forget means notification failure is transparent
      expect(result.status).toBe('PENDING');
    });
  });

  // ─── withdrawApplication ───
  describe('withdrawApplication', () => {
    const mockApplication = {
      id: 'app1',
      applicantId: 'applicant1',
      status: 'PENDING',
      jobId: 'job1',
      job: { id: 'job1', userId: 'owner1', title: 'Test Job' },
      // NOTIF-5: applicant name is now included
      applicant: { displayName: 'Ali Driver', username: 'alidriver' },
    };

    it('should withdraw own PENDING application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApplication);
      mockPrisma.jobApplication.update.mockResolvedValue({ ...mockApplication, status: 'WITHDRAWN' });

      const result = await service.withdrawApplication('app1', 'applicant1');

      expect(result.status).toBe('WITHDRAWN');
      expect(mockNotifications.create).toHaveBeenCalled();
      // Verify notification body includes applicant name (NOTIF-5)
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('Ali Driver') }),
      );
    });

    it('should throw ForbiddenException for non-applicant', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApplication);

      await expect(
        service.withdrawApplication('app1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for non-PENDING application', async () => {
      const accepted = { ...mockApplication, status: 'ACCEPTED' };
      mockPrisma.jobApplication.findUnique.mockResolvedValue(accepted);

      await expect(
        service.withdrawApplication('app1', 'applicant1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.withdrawApplication('nonexistent', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───
  describe('remove', () => {
    const mockJob = { id: '1', userId: 'user1', status: 'ACTIVE', slug: 'test-job', title: 'Test Job' };

    it('should delete job and return success message', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);
      mockPrisma.driverJob.delete.mockResolvedValue(mockJob);

      const result = await service.remove('1', 'user1');

      expect(result.message).toBeDefined();
      expect(mockPrisma.driverJob.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should notify ACCEPTED applicants with a distinct title (C-2)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { applicantId: 'a1', status: 'ACCEPTED' },
        { applicantId: 'a2', status: 'PENDING' },
      ]);
      mockPrisma.driverJob.delete.mockResolvedValue(mockJob);

      await service.remove('1', 'user1');

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تم حذف الوظيفة التي قُبلت فيها' }),
      );
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);

      await expect(service.remove('1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateApplicationStatus ───
  describe('updateApplicationStatus', () => {
    const mockApp = {
      id: 'app1',
      status: 'PENDING',
      applicantId: 'applicant1',
      job: { userId: 'owner1', title: 'Test Job', status: 'ACTIVE', id: 'job1' },
      applicant: { id: 'applicant1' },
    };

    it('should throw ForbiddenException when employer attempts WITHDRAWN (H-5)', async () => {
      await expect(
        service.updateApplicationStatus('app1', 'owner1', 'WITHDRAWN' as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for non-owner (RBAC)', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);

      await expect(
        service.updateApplicationStatus('app1', 'other-user', 'ACCEPTED' as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when accepting on a CLOSED job (H-3)', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApp,
        job: { ...mockApp.job, status: 'CLOSED' },
      });

      await expect(
        service.updateApplicationStatus('app1', 'owner1', 'ACCEPTED' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when accepting on an EXPIRED job (H-3)', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApp,
        job: { ...mockApp.job, status: 'EXPIRED' },
      });

      await expect(
        service.updateApplicationStatus('app1', 'owner1', 'ACCEPTED' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when CAS detects a stale read (C-1 race)', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);
      // Another write already changed the status — updateMany affected 0 rows
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateApplicationStatus('app1', 'owner1', 'ACCEPTED' as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should accept application and fire notification', async () => {
      const accepted = {
        id: 'app1',
        status: 'ACCEPTED',
        applicant: { id: 'applicant1', username: 'ali', displayName: 'Ali', avatarUrl: null, isVerified: false },
      };
      // First findUnique = initial lookup; second = inside $transaction
      mockPrisma.jobApplication.findUnique
        .mockResolvedValueOnce(mockApp)
        .mockResolvedValueOnce(accepted);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateApplicationStatus('app1', 'owner1', 'ACCEPTED' as any);

      expect(result.status).toBe('ACCEPTED');
      expect(mockNotifications.create).toHaveBeenCalled();
    });

    it('should reject application and fire notification', async () => {
      const rejected = {
        id: 'app1',
        status: 'REJECTED',
        applicant: { id: 'applicant1', username: 'ali', displayName: 'Ali', avatarUrl: null, isVerified: false },
      };
      mockPrisma.jobApplication.findUnique
        .mockResolvedValueOnce(mockApp)
        .mockResolvedValueOnce(rejected);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateApplicationStatus('app1', 'owner1', 'REJECTED' as any);

      expect(result.status).toBe('REJECTED');
      expect(mockNotifications.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.updateApplicationStatus('nonexistent', 'owner1', 'ACCEPTED' as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
