import { Test, TestingModule } from '@nestjs/testing';
import { DriverVerificationService } from '../driver-verification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  driverProfile: { findUnique: jest.fn(), update: jest.fn() },
  driverVerification: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
};

const mockNotifications = { create: jest.fn().mockResolvedValue({}) };

describe('DriverVerificationService', () => {
  let service: DriverVerificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<DriverVerificationService>(DriverVerificationService);
  });

  describe('submit', () => {
    it('should submit a verification request', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'u1', isVerified: false });
      mockPrisma.driverVerification.findFirst.mockResolvedValue(null);
      mockPrisma.driverVerification.create.mockResolvedValue({
        id: 'v1', driverProfileId: 'dp1', status: 'PENDING',
        licenseImageUrl: 'url1', idImageUrl: 'url2',
      });

      const result = await service.submit('u1', { licenseImageUrl: 'url1', idImageUrl: 'url2' });
      expect(result.id).toBe('v1');
      expect(result.status).toBe('PENDING');
    });

    it('should throw NotFoundException if no driver profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.submit('u1', { licenseImageUrl: 'x', idImageUrl: 'y' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already verified', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'u1', isVerified: true });
      await expect(
        service.submit('u1', { licenseImageUrl: 'x', idImageUrl: 'y' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if pending request exists', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'u1', isVerified: false });
      mockPrisma.driverVerification.findFirst.mockResolvedValue({ id: 'existing', status: 'PENDING' });
      await expect(
        service.submit('u1', { licenseImageUrl: 'x', idImageUrl: 'y' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getMyStatus', () => {
    it('should return verification history', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1' });
      mockPrisma.driverVerification.findMany.mockResolvedValue([{ id: 'v1', status: 'PENDING' }]);

      const result = await service.getMyStatus('u1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyStatus('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminReview', () => {
    const setupReview = () => {
      mockPrisma.driverVerification.findUnique.mockResolvedValue({
        id: 'v1', driverProfileId: 'dp1', status: 'PENDING',
        driverProfile: { userId: 'u1', user: { id: 'u1' } },
      });
      mockPrisma.driverVerification.update.mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data }));
      mockPrisma.driverProfile.update.mockResolvedValue({});
    };

    it('should approve verification and set isVerified=true', async () => {
      setupReview();
      const result = await service.adminReview('v1', 'admin1', 'APPROVED');
      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isVerified: true } }),
      );
      expect(mockNotifications.create).toHaveBeenCalled();
    });

    it('should reject verification with reason', async () => {
      setupReview();
      const result = await service.adminReview('v1', 'admin1', 'REJECTED', 'صور غير واضحة');
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('صور غير واضحة');
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent verification', async () => {
      mockPrisma.driverVerification.findUnique.mockResolvedValue(null);
      await expect(service.adminReview('bad', 'admin1', 'APPROVED')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      mockPrisma.driverVerification.findUnique.mockResolvedValue({
        id: 'v1', status: 'APPROVED',
        driverProfile: { userId: 'u1', user: { id: 'u1' } },
      });
      await expect(service.adminReview('v1', 'admin1', 'REJECTED')).rejects.toThrow(BadRequestException);
    });
  });

  describe('adminList', () => {
    it('should return paginated verifications', async () => {
      mockPrisma.driverVerification.findMany.mockResolvedValue([{ id: 'v1' }]);
      mockPrisma.driverVerification.count.mockResolvedValue(1);
      const result = await service.adminList();
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.driverVerification.findMany.mockResolvedValue([]);
      mockPrisma.driverVerification.count.mockResolvedValue(0);
      await service.adminList('PENDING');
      expect(mockPrisma.driverVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } }),
      );
    });
  });
});
