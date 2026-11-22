import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LIST_FIRST_IMAGE_AND_COUNT_INCLUDE } from '../utils/entity.utils';
import { EquipmentListingsService } from '../../equipment/equipment-listings.service';
import { PartsService } from '../../parts/parts.service';
import { ServicesService } from '../../services/services.service';
import { BusesService } from '../../buses/buses.service';
import { ListingsRepository } from '../../listings/listings.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { GeoService } from '../../locations/geo.service';
import { SellerContactGate } from '../services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../services/active-listings-limit.service';
import { EquipmentViewCounterService } from '../../equipment/equipment-view-counter.service';

describe('D-B17 Requirement 1: Shared list image count (_count.images) contract per vertical', () => {
  it('shared LIST_FIRST_IMAGE_AND_COUNT_INCLUDE defines take: 1 ordered images and _count.select.images', () => {
    expect(LIST_FIRST_IMAGE_AND_COUNT_INCLUDE).toEqual({
      images: { orderBy: { order: 'asc' }, take: 1 },
      _count: { select: { images: true } },
    });
  });

  it('EquipmentListingsService.findAll requests LIST_FIRST_IMAGE_AND_COUNT_INCLUDE and returns { items, meta } with _count.images', async () => {
    const mockItem = {
      id: 'eq-1',
      title: 'Excavator',
      images: [{ id: 'img-1', url: 'https://cdn.example.com/1.jpg', order: 0 }],
      _count: { images: 4 },
    };
    const prismaMock: any = {
      equipmentListing: {
        findMany: jest.fn().mockResolvedValue([mockItem]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    };

    const mod = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: {} },
        { provide: ActiveListingsLimitService, useValue: {} },
        { provide: EquipmentViewCounterService, useValue: {} },
      ],
    }).compile();

    const svc = mod.get(EquipmentListingsService);
    const res = await svc.findAll({ page: 1, limit: 20 } as any);

    expect(prismaMock.equipmentListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          images: { orderBy: { order: 'asc' }, take: 1 },
          _count: { select: { images: true } },
        }),
      }),
    );
    expect(res).toEqual({
      items: [expect.objectContaining({ id: 'eq-1', _count: { images: 4 } })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('PartsService.findAll requests LIST_FIRST_IMAGE_AND_COUNT_INCLUDE and returns { items, meta } with _count.images', async () => {
    const mockItem = {
      id: 'part-1',
      title: 'Brake Pad',
      images: [{ id: 'img-1', url: 'https://cdn.example.com/1.jpg', order: 0 }],
      _count: { images: 3 },
    };
    const prismaMock: any = {
      sparePart: {
        findMany: jest.fn().mockResolvedValue([mockItem]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const mod = await Test.createTestingModule({
      providers: [
        PartsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), setNX: jest.fn(), del: jest.fn(), delPattern: jest.fn() } },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: {} },
        { provide: ActiveListingsLimitService, useValue: {} },
      ],
    }).compile();

    const svc = mod.get(PartsService);
    const res = await svc.findAll({ page: '1', limit: '20' } as any);

    expect(prismaMock.sparePart.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          images: { orderBy: { order: 'asc' }, take: 1 },
          _count: { select: { images: true } },
        }),
      }),
    );
    expect(res).toEqual({
      items: [expect.objectContaining({ id: 'part-1', _count: { images: 3 } })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('ServicesService.findAll (via BaseListingService.getListInclude) requests LIST_FIRST_IMAGE_AND_COUNT_INCLUDE and returns { items, meta } with _count.images', async () => {
    const mockItem = {
      id: 'svc-1',
      title: 'Oil Change',
      images: [{ id: 'img-1', url: 'https://cdn.example.com/1.jpg', order: 0 }],
      _count: { images: 5 },
    };
    const prismaMock: any = {
      carService: {
        findMany: jest.fn().mockResolvedValue([mockItem]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const redisMock: any = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const mod = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: {} },
        { provide: ActiveListingsLimitService, useValue: {} },
      ],
    }).compile();

    const svc = mod.get(ServicesService);
    const res = await svc.findAll({ page: '1', limit: '20' } as any);

    expect(prismaMock.carService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          images: { orderBy: { order: 'asc' }, take: 1 },
          _count: { select: { images: true } },
        }),
      }),
    );
    expect(res).toEqual({
      items: [expect.objectContaining({ id: 'svc-1', _count: { images: 5 } })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('Cars (ListingsRepository.findMany) and Buses (BusesService.findAll) keep full images list unchanged', async () => {
    const prismaMock: any = {
      listing: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      busListing: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    };

    const listingsRepo = new ListingsRepository(prismaMock);
    await listingsRepo.findMany({}, { createdAt: 'desc' }, 0, 20);
    const carsInclude = prismaMock.listing.findMany.mock.calls[0][0].include;
    expect(carsInclude.images).toEqual({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    expect(carsInclude._count).toBeUndefined();

    const busesSvc = new BusesService(
      {} as any,
      prismaMock,
      { get: jest.fn().mockResolvedValue(null), set: jest.fn() } as any,
      { emit: jest.fn() } as any,
      {} as any,
      {} as any,
    );
    await busesSvc.findAll({ page: '1', limit: '20' } as any);
    const busesInclude = prismaMock.busListing.findMany.mock.calls[0][0].include;
    expect(busesInclude.images).toEqual({ orderBy: { order: 'asc' } });
    expect(busesInclude._count).toBeUndefined();
  });
});
