import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PartsService } from './parts.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';
import { SearchService } from '../search/search.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

describe('PartsService', () => {
  let service: PartsService;
  
  const mockGeoService = {
    validateLocationPair: jest.fn(),
  };

  const mockPrisma: any = {
    sparePart: {
      create: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    outboxEvent: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    mockPrisma.sparePart.create.mockResolvedValue({ id: '1', price: { toNumber: () => 10 } });
    mockPrisma.sparePart.findUnique.mockResolvedValue({ id: '1', sellerId: 'seller-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), setNX: jest.fn(), del: jest.fn(), delPattern: jest.fn() } },
        { provide: GeoService, useValue: mockGeoService },
        { provide: SearchService, useValue: { indexDocument: jest.fn(), removeDocument: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PartsService>(PartsService);
  });

  describe('cross-validation for locations', () => {
    it('should fail on create if wilaya mismatch', async () => {
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { title: 'Part', price: 100, governorateId: 1, wilayaId: 10 } as any;
      await expect(service.create(dto, 'seller-1')).rejects.toThrow('Mismatch');
    });

    it('should fail on update if wilaya mismatch', async () => {
      mockGeoService.validateLocationPair.mockRejectedValueOnce(new Error('Mismatch'));
      const dto = { governorateId: 1, wilayaId: 10 } as any;
      await expect(service.update('1', 'seller-1', dto)).rejects.toThrow('Mismatch');
    });
  });

  describe('5-minute duplicate guard', () => {
    it('throws ConflictException when duplicate spare part is created within 5 minutes', async () => {
      mockPrisma.sparePart.findFirst.mockResolvedValueOnce({ id: 'existing-part' });
      const dto = {
        title: 'فلتر هواء أصلي',
        description: 'فلتر هواء جديد',
        partCategory: 'ENGINE',
        price: 25,
        governorateId: 1,
        wilayaId: 101,
      } as any;

      await expect(service.create(dto, 'seller-1')).rejects.toThrow(
        new ConflictException('تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.'),
      );
      expect(mockPrisma.sparePart.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          sellerId: 'seller-1',
          title: 'فلتر هواء أصلي',
          description: 'فلتر هواء جديد',
          partCategory: 'ENGINE',
          price: new Prisma.Decimal(25),
          deletedAt: null,
          createdAt: { gte: expect.any(Date) },
        }),
      });
      expect(mockPrisma.sparePart.create).not.toHaveBeenCalled();
    });

    it('allows creation when no duplicate exists within 5 minutes', async () => {
      mockPrisma.sparePart.findFirst.mockResolvedValueOnce(null);
      const dto = {
        title: 'فلتر هواء أصلي',
        description: 'فلتر هواء جديد',
        partCategory: 'ENGINE',
        price: 30,
        governorateId: 1,
        wilayaId: 101,
      } as any;

      await expect(service.create(dto, 'seller-1')).resolves.toBeDefined();
      expect(mockPrisma.sparePart.create).toHaveBeenCalledTimes(1);
    });
  });
});
