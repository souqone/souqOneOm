import { Test, TestingModule } from '@nestjs/testing';
import { AdminJobsService } from '../admin-jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  driverJob: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobApplication: { count: jest.fn() },
  driverProfile: { findMany: jest.fn(), count: jest.fn() },
  employerProfile: { findMany: jest.fn(), count: jest.fn() },
  driverVerification: { count: jest.fn() },
};

describe('AdminJobsService', () => {
  let service: AdminJobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminJobsService,
        { provide: PrismaService, useValue: mockPrisma },
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
    it('should update job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1' });
      mockPrisma.driverJob.update.mockResolvedValue({ id: 'j1', status: 'CLOSED' });

      const result = await service.updateJob('j1', { status: 'CLOSED' });
      expect(result.status).toBe('CLOSED');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);
      await expect(service.updateJob('bad', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteJob', () => {
    it('should delete job', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue({ id: 'j1' });
      mockPrisma.driverJob.delete.mockResolvedValue({ id: 'j1' });

      const result = await service.deleteJob('j1');
      expect(result.id).toBe('j1');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.driverJob.findUnique.mockResolvedValue(null);
      await expect(service.deleteJob('bad')).rejects.toThrow(NotFoundException);
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
