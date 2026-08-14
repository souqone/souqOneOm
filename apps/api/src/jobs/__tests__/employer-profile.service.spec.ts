import { Test, TestingModule } from '@nestjs/testing';
import { EmployerProfileService } from '../employer-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GeoService } from '../../locations/geo.service';

const mockGeoService = {
  validateLocationPair: jest.fn(),
};

const mockPrisma = {
  employerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('EmployerProfileService', () => {
  let service: EmployerProfileService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployerProfileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
      ],
    }).compile();
    service = module.get<EmployerProfileService>(EmployerProfileService);
  });

  describe('create', () => {
    it('should create an employer profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue(null);
      mockPrisma.employerProfile.create.mockResolvedValue({
        id: 'ep1',
        userId: 'user1',
        companyName: 'Test Co',
        governorate: 'Muscat',
      });

      const result = await service.create('user1', {
        companyName: 'Test Co',
        governorate: 'Muscat',
      } as any);

      expect(result.id).toBe('ep1');
    });

    it('should throw ConflictException if profile exists', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('user1', { governorate: 'Muscat' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should fail on create if wilaya mismatch (RED)', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue(null);
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.create('user1', dto)).rejects.toThrow('Mismatch');
    });
  });

  describe('getMyProfile', () => {
    it('should return profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue({ id: 'ep1', userId: 'user1' });

      const result = await service.getMyProfile('user1');
      expect(result.id).toBe('ep1');
    });

    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue({ id: 'ep1', userId: 'user1' });
      mockPrisma.employerProfile.update.mockResolvedValue({
        id: 'ep1',
        companyName: 'Updated Co',
      });

      const result = await service.update('user1', { companyName: 'Updated Co' } as any);
      expect(result.companyName).toBe('Updated Co');
    });

    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user1', { companyName: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail on update if wilaya mismatch (RED)', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue({ id: 'ep1', userId: 'user1' });
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.update('user1', dto)).rejects.toThrow('Mismatch');
    });
  });

  describe('findOne', () => {
    it('should return profile by id', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue({ id: 'ep1' });

      const result = await service.findOne('ep1');
      expect(result.id).toBe('ep1');
    });

    it('should throw NotFoundException for non-existent profile', async () => {
      mockPrisma.employerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
