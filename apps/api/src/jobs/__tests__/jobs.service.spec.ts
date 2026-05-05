import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from '../jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SearchService } from '../../search/search.service';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';

// ── Mocks ──
const mockPrisma = {
  driverJob: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobApplication: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incr: jest.fn().mockResolvedValue(1),
  getTTL: jest.fn().mockResolvedValue(-1),
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue(undefined),
};

const mockSearch = {
  indexDocument: jest.fn().mockResolvedValue(undefined),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
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

  // ─── update (status toggle) ───
  describe('update', () => {
    const mockJob = { id: '1', userId: 'user1', status: 'ACTIVE' };

    it('should allow status change to CLOSED', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.driverJob.update.mockResolvedValue({ ...mockJob, status: 'CLOSED' });

      const result = await service.update('1', 'user1', { status: 'CLOSED' } as any);

      expect(result.status).toBe('CLOSED');
    });

    it('should allow status change to ACTIVE', async () => {
      const closedJob = { ...mockJob, status: 'CLOSED' };
      mockPrisma.driverJob.findUnique.mockResolvedValue(closedJob);
      mockPrisma.driverJob.update.mockResolvedValue({ ...closedJob, status: 'ACTIVE' });

      const result = await service.update('1', 'user1', { status: 'ACTIVE' } as any);

      expect(result.status).toBe('ACTIVE');
    });

    it('should reject status change to EXPIRED', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.update('1', 'user1', { status: 'EXPIRED' } as any),
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
  });

  // ─── apply ───
  describe('apply', () => {
    const mockJob = { id: 'job1', userId: 'owner1', status: 'ACTIVE', title: 'Driver needed' };

    it('should create an application', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);
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

    it('should throw ConflictException for duplicate application', async () => {
      mockPrisma.driverJob.findFirst.mockResolvedValue(mockJob);
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
  });

  // ─── withdrawApplication ───
  describe('withdrawApplication', () => {
    const mockApplication = {
      id: 'app1',
      applicantId: 'applicant1',
      status: 'PENDING',
      jobId: 'job1',
      job: { userId: 'owner1', title: 'Test Job' },
    };

    it('should withdraw own PENDING application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApplication);
      mockPrisma.jobApplication.update.mockResolvedValue({ ...mockApplication, status: 'WITHDRAWN' });

      const result = await service.withdrawApplication('app1', 'applicant1');

      expect(result.status).toBe('WITHDRAWN');
      expect(mockNotifications.create).toHaveBeenCalled();
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
});
