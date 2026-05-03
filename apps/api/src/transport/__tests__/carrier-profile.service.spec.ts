import { Test, TestingModule } from '@nestjs/testing';
import { CarrierProfileService } from '../carrier-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  carrierProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('CarrierProfileService', () => {
  let service: CarrierProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarrierProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CarrierProfileService>(CarrierProfileService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if profile already exists', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create('user1', { vehicleTypes: [], serviceTypes: [], governorate: 'مسقط' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new carrier profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(null);
      mockPrisma.carrierProfile.create.mockResolvedValue({ id: 'new', userId: 'user1' });
      const result = await service.create('user1', {
        vehicleTypes: ['PICKUP'],
        serviceTypes: ['GOODS'],
        governorate: 'مسقط',
      } as any);
      expect(result).toEqual({ id: 'new', userId: 'user1' });
      expect(mockPrisma.carrierProfile.create).toHaveBeenCalled();
    });
  });

  describe('getMyProfile', () => {
    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyProfile('user1')).rejects.toThrow(NotFoundException);
    });

    it('should return existing profile', async () => {
      const profile = { id: 'p1', userId: 'user1' };
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(profile);
      expect(await service.getMyProfile('user1')).toEqual(profile);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(null);
      await expect(service.update('user1', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should update profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.carrierProfile.update.mockResolvedValue({ id: 'p1', bio: 'updated' });
      const result = await service.update('user1', { bio: 'updated' } as any);
      expect(result.bio).toBe('updated');
    });
  });

  describe('findAll', () => {
    it('should return paginated carriers with filters', async () => {
      const items = [{ id: 'p1' }];
      mockPrisma.$transaction.mockResolvedValue([items, 1]);
      const result = await service.findAll({ governorate: 'مسقط' });
      expect(result.items).toEqual(items);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('setAvailability', () => {
    it('should throw NotFoundException if no profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(null);
      await expect(service.setAvailability('user1', true)).rejects.toThrow(NotFoundException);
    });

    it('should toggle availability', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.carrierProfile.update.mockResolvedValue({ id: 'p1', isAvailable: true });
      const result = await service.setAvailability('user1', true);
      expect(result.isAvailable).toBe(true);
    });
  });
});
