import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsService } from '../admin-jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SearchService } from '../../search/search.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  driverJob: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobApplication: { findMany: jest.fn(), count: jest.fn() },
  driverProfile: { findMany: jest.fn(), count: jest.fn() },
  employerProfile: { findMany: jest.fn(), count: jest.fn() },
  driverVerification: { count: jest.fn() },
  cleanupPolymorphicOrphans: jest.fn(),
};

const mockRedis = { del: jest.fn(), delPattern: jest.fn() };
const mockSearch = { removeDocument: jest.fn().mockResolvedValue(undefined), indexDocument: jest.fn() };
const mockNotifications = { create: jest.fn().mockResolvedValue(undefined) };

describe('AdminJobsService', () => {
  let service: AdminJobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminJobsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: SearchService, useValue: mockSearch },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<AdminJobsService>(AdminJobsService);
  });

  describe('listJobs', () => {
    it('should return paginated jobs', async () => {
      mockPrisma.driverJob.findMany.mockResolvedValue([{ id: 'j1', title: 'Test' }]);
      mockPrisma.driverJob.count.mockResolvedValue(1);

      const result = await service.listJobs({});
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.driverJob.findMany.mockResolvedValue([]);
      mockPrisma.driverJob.count.mockResolvedValue(0);

      await service.listJobs({ status: 'ACTIVE' });
      expect(mockPrisma.driverJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });
  });

  describe('updateJob', () => {
    it('should update job and return updated record', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1', status: 'ACTIVE', slug: null, userId: 'u1', title: 'Job' });
      mockPrisma.driverJob.update.mockResolvedValue({ id: 'j1', status: 'CLOSED' });

      const result = await service.updateJob('j1', { status: 'CLOSED' });
      expect(result.status).toBe('CLOSED');
    });

    it('should throw NotFoundException for missing job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);
      await expect(service.updateJob('bad', {})).rejects.toThrow(NotFoundException);
    });

    it('should strip non-whitelisted fields — only status and title are written (H-7 / Admin Authorization Test)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1', status: 'ACTIVE', slug: null, userId: 'u1', title: 'Job' });
      mockPrisma.driverJob.update.mockResolvedValue({ id: 'j1', status: 'CLOSED' });

      await service.updateJob('j1', { status: 'CLOSED', userId: 'hacked' } as any);

      expect(mockPrisma.driverJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ userId: 'hacked' }),
        }),
      );
    });
  });

  describe('deleteJob', () => {
    it('should delete job and return success message', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1', slug: null, userId: 'u1', title: 'Job' });
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);
      mockPrisma.driverJob.delete.mockResolvedValue({ id: 'j1' });
      mockPrisma.cleanupPolymorphicOrphans.mockResolvedValue(undefined);

      const result = await service.deleteJob('j1');
      expect(result.message).toBeDefined();
      expect(mockPrisma.driverJob.delete).toHaveBeenCalledWith({ where: { id: 'j1' } });
    });

    it('should notify pending applicants on delete', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1', slug: null, userId: 'u1', title: 'Job' });
      mockPrisma.jobApplication.findMany.mockResolvedValue([{ applicantId: 'a1' }, { applicantId: 'a2' }]);
      mockPrisma.driverJob.delete.mockResolvedValue({ id: 'j1' });
      mockPrisma.cleanupPolymorphicOrphans.mockResolvedValue(undefined);

      await service.deleteJob('j1');
      // owner + 2 applicants = 3 notifications
      expect(mockNotifications.create).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException for missing job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);
      await expect(service.deleteJob('bad')).rejects.toThrow(NotFoundException);
    });

    it('should send a distinct title to ACCEPTED applicants (C-2)', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1', slug: null, userId: 'u1', title: 'Accepted Job' });
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { applicantId: 'a1', status: 'ACCEPTED' },
        { applicantId: 'a2', status: 'PENDING' },
      ]);
      mockPrisma.driverJob.delete.mockResolvedValue({ id: 'j1' });
      mockPrisma.cleanupPolymorphicOrphans.mockResolvedValue(undefined);

      await service.deleteJob('j1');

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تم حذف الوظيفة التي قُبلت فيها' }),
      );
      // owner + ACCEPTED applicant + PENDING applicant = 3
      expect(mockNotifications.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      mockPrisma.driverJob.count.mockResolvedValue(10);
      mockPrisma.jobApplication.count.mockResolvedValue(5);
      mockPrisma.driverProfile.count.mockResolvedValue(3);
      mockPrisma.employerProfile.count.mockResolvedValue(2);
      mockPrisma.driverVerification.count.mockResolvedValue(1);

      const result = await service.getStats();
      expect(result.jobs.total).toBe(10);
      expect(result.applications.total).toBe(5);
    });
  });

  describe('listDrivers', () => {
    it('should return paginated drivers', async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([{ id: 'd1' }]);
      mockPrisma.driverProfile.count.mockResolvedValue(1);

      const result = await service.listDrivers({});
      expect(result.items).toHaveLength(1);
    });
  });

  describe('listEmployers', () => {
    it('should return paginated employers', async () => {
      mockPrisma.employerProfile.findMany.mockResolvedValue([{ id: 'e1' }]);
      mockPrisma.employerProfile.count.mockResolvedValue(1);

      const result = await service.listEmployers({});
      expect(result.items).toHaveLength(1);
    });
  });
});
