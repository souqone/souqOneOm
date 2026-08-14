import { Test, TestingModule } from '@nestjs/testing';
import { DriverProfileService } from '../driver-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GeoService } from '../../locations/geo.service';

const mockGeoService = {
  validateLocationPair: jest.fn(),
};

const mockPrisma = {
  driverProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('DriverProfileService', () => {
  let service: DriverProfileService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverProfileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
      ],
    }).compile();
    service = module.get<DriverProfileService>(DriverProfileService);
  });

  describe('create', () => {
    it('should create a driver profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);
      mockPrisma.driverProfile.create.mockResolvedValue({
        id: 'dp1',
        userId: 'user1',
        licenseTypes: ['HEAVY'],
        governorate: 'Muscat',
      });

      const result = await service.create('user1', {
        licenseTypes: ['HEAVY'] as any,
        governorate: 'Muscat',
      } as any);

      expect(result.id).toBe('dp1');
      expect(mockPrisma.driverProfile.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if profile exists', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('user1', { licenseTypes: ['HEAVY'], governorate: 'Muscat' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should fail on create if wilaya mismatch (RED)', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.create('user1', dto)).rejects.toThrow('Mismatch');
    });
  });

  describe('getMyProfile', () => {
    it('should return user profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'user1' });

      const result = await service.getMyProfile('user1');
      expect(result.id).toBe('dp1');
    });

    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'user1' });
      mockPrisma.driverProfile.update.mockResolvedValue({
        id: 'dp1',
        userId: 'user1',
        bio: 'Updated bio',
      });

      const result = await service.update('user1', { bio: 'Updated bio' } as any);
      expect(result.bio).toBe('Updated bio');
    });

    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user1', { bio: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail on update if wilaya mismatch (RED)', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1', userId: 'user1' });
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.update('user1', dto)).rejects.toThrow('Mismatch');
    });
  });

  describe('findOne', () => {
    it('should return profile by id', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({ id: 'dp1' });

      const result = await service.findOne('dp1');
      expect(result.id).toBe('dp1');
    });

    it('should throw NotFoundException for non-existent profile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated drivers', async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([{ id: 'dp1' }]);
      mockPrisma.driverProfile.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by governorate', async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([]);
      mockPrisma.driverProfile.count.mockResolvedValue(0);

      await service.findAll({ governorate: 'Muscat' } as any);

      expect(mockPrisma.driverProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ governorate: 'Muscat' }),
        }),
      );
    });
  });
});
