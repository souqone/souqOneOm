import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServicesService } from '../services.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoService } from '../../locations/geo.service';
import { RedisService } from '../../redis/redis.service';
import { SellerContactGate } from '../../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../../common/services/active-listings-limit.service';

describe('D-B14: ServicesService.update Image Handling', () => {
  let service: ServicesService;
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const mockCarServiceImage = {
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    createMany: jest.fn().mockResolvedValue({ count: 2 }),
  };

  const mockPrisma = {
    carService: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'svc-1', userId: 'owner-1', version: 2 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    carServiceImage: mockCarServiceImage,
    outboxEvent: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockPrisma)),
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(1),
    delPattern: jest.fn().mockResolvedValue(undefined),
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockGeoService = {
    validateLocationPair: jest.fn(),
    syncLocation: jest.fn(),
    clearLocation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
    mockPrisma.carService.findUnique.mockResolvedValue({
      id: 'svc-1',
      userId: 'owner-1',
      version: 1,
      deletedAt: null,
      governorateId: null,
      wilayaId: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: GeoService, useValue: mockGeoService },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn() } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('leaves existing carServiceImage untouched when dto.images is undefined', async () => {
    await service.update('svc-1', 'owner-1', { title: 'خدمة محدثة' } as any);
    expect(mockCarServiceImage.deleteMany).not.toHaveBeenCalled();
    expect(mockCarServiceImage.createMany).not.toHaveBeenCalled();
  });

  it('syncs carServiceImage in order with isPrimary=true for index 0 when dto.images is provided', async () => {
    const urls = [
      'https://res.cloudinary.com/souqone/image/upload/v1/a.jpg',
      'https://res.cloudinary.com/souqone/image/upload/v2/b.jpg',
    ];
    await service.update('svc-1', 'owner-1', { title: 'خدمة محدثة', images: urls } as any);

    expect(mockCarServiceImage.deleteMany).toHaveBeenCalledWith({ where: { carServiceId: 'svc-1' } });
    expect(mockCarServiceImage.createMany).toHaveBeenCalledWith({
      data: [
        { carServiceId: 'svc-1', url: urls[0], order: 0, isPrimary: true },
        { carServiceId: 'svc-1', url: urls[1], order: 1, isPrimary: false },
      ],
    });
    expect(mockRedis.del).toHaveBeenCalledWith('carService:detail:svc-1');
    expect(mockRedis.delPattern).toHaveBeenCalledWith('carService:list:*');
  });

  it('rejects untrusted image URLs and >10 images before mutating', async () => {
    await expect(
      service.update('svc-1', 'owner-1', {
        images: ['https://evil.example.com/x.jpg'],
      } as any),
    ).rejects.toThrow(BadRequestException);

    const tooMany = Array.from(
      { length: 11 },
      (_, i) => `https://res.cloudinary.com/souqone/image/upload/v1/img${i}.jpg`,
    );
    await expect(
      service.update('svc-1', 'owner-1', { images: tooMany } as any),
    ).rejects.toThrow(BadRequestException);

    expect(mockCarServiceImage.deleteMany).not.toHaveBeenCalled();
  });

  afterAll(() => {
    if (originalCloudName === undefined) {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    } else {
      process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
    }
  });
});
