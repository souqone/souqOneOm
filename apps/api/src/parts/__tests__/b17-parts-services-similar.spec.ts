import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PartsService } from '../parts.service';
import { ServicesService } from '../../services/services.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { GeoService } from '../../locations/geo.service';
import { SellerContactGate } from '../../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../../common/services/active-listings-limit.service';
import { PUBLIC_ROUTES_ALLOWLIST } from '../../common/constants/public-routes.allowlist';

describe('D-B17 Requirement 2: PartsService.findSimilar & ServicesService.findSimilar', () => {
  describe('PUBLIC_ROUTES_ALLOWLIST registration', () => {
    it('includes GET /parts/:id/similar and GET /services/:id/similar', () => {
      expect(PUBLIC_ROUTES_ALLOWLIST).toContain('GET /parts/:id/similar');
      expect(PUBLIC_ROUTES_ALLOWLIST).toContain('GET /services/:id/similar');
    });
  });

  describe('PartsService.findSimilar', () => {
    let service: PartsService;
    let prismaMock: any;
    let redisMock: any;

    const mockOriginalPart = (over: Record<string, any> = {}) => ({
      id: 'part-1',
      status: 'ACTIVE',
      sellerId: 'seller-1',
      hiddenByOwnerStatus: false,
      deletedAt: null,
      partCategory: 'ENGINE',
      compatibleMakes: ['Toyota', 'Lexus'],
      price: '100',
      ...over,
    });

    beforeEach(async () => {
      prismaMock = {
        sparePart: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: 'part-1' }),
          update: jest.fn().mockResolvedValue({ id: 'part-1' }),
        },
        outboxEvent: { create: jest.fn().mockResolvedValue({}) },
        cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn(async (cb: any) => cb(prismaMock)),
      };
      redisMock = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        delPattern: jest.fn().mockResolvedValue(undefined),
      };

      const mod = await Test.createTestingModule({
        providers: [
          PartsService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: RedisService, useValue: redisMock },
          { provide: GeoService, useValue: { validateLocationPair: jest.fn(), syncLocation: jest.fn(), clearLocation: jest.fn() } },
          { provide: EventEmitter2, useValue: { emit: jest.fn() } },
          { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn() } },
          { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn() } },
        ],
      }).compile();

      service = mod.get(PartsService);
    });

    it('throws 404 for unknown or soft-deleted original part before consulting cache', async () => {
      prismaMock.sparePart.findFirst.mockResolvedValueOnce(null);
      await expect(service.findSimilar('missing-part')).rejects.toThrow(NotFoundException);
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it.each(['DRAFT', 'ARCHIVED', 'SUSPENDED'])(
      'throws 404 for visitor when original part status is %s, and does not read cache',
      async (status) => {
        prismaMock.sparePart.findFirst.mockResolvedValueOnce(mockOriginalPart({ status }));
        await expect(service.findSimilar('part-1', 8, undefined)).rejects.toThrow(NotFoundException);
        expect(redisMock.get).not.toHaveBeenCalled();
      },
    );

    it('throws 404 for visitor when original part has hiddenByOwnerStatus: true, and allows owner', async () => {
      prismaMock.sparePart.findFirst.mockResolvedValueOnce(mockOriginalPart({ hiddenByOwnerStatus: true }));
      await expect(service.findSimilar('part-1', 8, undefined)).rejects.toThrow(NotFoundException);
      expect(redisMock.get).not.toHaveBeenCalled();

      prismaMock.sparePart.findFirst.mockResolvedValueOnce(mockOriginalPart({ hiddenByOwnerStatus: true }));
      const ownerRes = await service.findSimilar('part-1', 8, { sub: 'seller-1', role: 'USER' });
      expect(ownerRes).toEqual([]);
    });

    it('clamps limit using Math.trunc(limit) || 8 into 1..20', async () => {
      prismaMock.sparePart.findFirst.mockResolvedValue(mockOriginalPart());
      await service.findSimilar('part-1', 0);
      expect(prismaMock.sparePart.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ take: 8 * 3 }));

      prismaMock.sparePart.findMany.mockClear();
      await service.findSimilar('part-1', 999);
      expect(prismaMock.sparePart.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ take: 20 * 3 }));

      prismaMock.sparePart.findMany.mockClear();
      await service.findSimilar('part-1', NaN);
      expect(prismaMock.sparePart.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ take: 8 * 3 }));
    });

    it('applies same partCategory, compatibleMakes hasSome, and +-30% price on narrow pass, then broadens to same partCategory', async () => {
      prismaMock.sparePart.findFirst.mockResolvedValueOnce(mockOriginalPart());
      const narrowCandidate = {
        id: 'part-2',
        createdAt: new Date('2026-02-01'),
        price: '105',
        seller: { id: 'u2', username: 's2', displayName: 'S2', avatarUrl: null, isVerified: true, governorate: 'Muscat', createdAt: new Date() },
      };
      const broaderCandidate = {
        id: 'part-3',
        createdAt: new Date('2026-02-02'),
        price: '250',
        seller: { id: 'u3', username: 's3', displayName: 'S3', avatarUrl: null, isVerified: false, governorate: 'Muscat', createdAt: new Date() },
      };
      prismaMock.sparePart.findMany
        .mockResolvedValueOnce([narrowCandidate])
        .mockResolvedValueOnce([broaderCandidate]);

      const res = await service.findSimilar('part-1', 2);

      expect(res.map((r: any) => r.id)).toEqual(['part-2', 'part-3']);
      const narrowCall = prismaMock.sparePart.findMany.mock.calls[0][0];
      expect(narrowCall.where).toMatchObject({
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        partCategory: 'ENGINE',
        compatibleMakes: { hasSome: ['Toyota', 'Lexus'] },
        id: { not: 'part-1' },
      });
      expect(narrowCall.where.price.gte.toNumber()).toBeCloseTo(70);
      expect(narrowCall.where.price.lte.toNumber()).toBeCloseTo(130);
      expect(narrowCall.include.seller.select).not.toHaveProperty('phone');
      expect(narrowCall.include.seller.select).not.toHaveProperty('email');
      expect(narrowCall.include._count).toEqual({ select: { images: true } });

      const broaderCall = prismaMock.sparePart.findMany.mock.calls[1][0];
      expect(broaderCall.where).toEqual({
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        partCategory: 'ENGINE',
        id: { notIn: ['part-1', 'part-2'] },
      });

      expect(redisMock.set).toHaveBeenCalledWith('sparePart:similar:part-1:2', res, 300);
    });

    it('invalidates sparePart:similar:* cache on create, update, and remove', async () => {
      await service.create({ title: 'T', description: 'D', partCategory: 'ENGINE', price: 10, governorateId: 1, wilayaId: 1 } as any, 'seller-1');
      expect(redisMock.delPattern).toHaveBeenCalledWith('sparePart:similar:*');

      redisMock.delPattern.mockClear();
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({ id: 'part-1', sellerId: 'seller-1', version: 1, deletedAt: null });
      await service.update('part-1', 'seller-1', { title: 'U', version: 1 } as any);
      expect(redisMock.delPattern).toHaveBeenCalledWith('sparePart:similar:*');

      redisMock.delPattern.mockClear();
      prismaMock.sparePart.findUnique.mockResolvedValueOnce({ id: 'part-1', sellerId: 'seller-1', version: 1, deletedAt: null });
      await service.remove('part-1', 'seller-1');
      expect(redisMock.delPattern).toHaveBeenCalledWith('sparePart:similar:*');
    });
  });

  describe('ServicesService.findSimilar', () => {
    let service: ServicesService;
    let prismaMock: any;
    let redisMock: any;

    const mockOriginalService = (over: Record<string, any> = {}) => ({
      id: 'svc-1',
      status: 'ACTIVE',
      userId: 'user-1',
      hiddenByOwnerStatus: false,
      deletedAt: null,
      serviceType: 'MAINTENANCE',
      governorateId: 1,
      priceFrom: '50',
      ...over,
    });

    beforeEach(async () => {
      prismaMock = {
        carService: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: 'svc-1' }),
          update: jest.fn().mockResolvedValue({ id: 'svc-1' }),
        },
        outboxEvent: { create: jest.fn().mockResolvedValue({}) },
        cleanupPolymorphicOrphans: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn(async (cb: any) => cb(prismaMock)),
      };
      redisMock = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        delPattern: jest.fn().mockResolvedValue(undefined),
      };

      const mod = await Test.createTestingModule({
        providers: [
          ServicesService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: RedisService, useValue: redisMock },
          { provide: GeoService, useValue: { validateLocationPair: jest.fn(), syncLocation: jest.fn(), clearLocation: jest.fn() } },
          { provide: EventEmitter2, useValue: { emit: jest.fn() } },
          { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn() } },
          { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn() } },
        ],
      }).compile();

      service = mod.get(ServicesService);
    });

    it('throws 404 for unknown or hidden original service before consulting cache', async () => {
      prismaMock.carService.findFirst.mockResolvedValueOnce(null);
      await expect(service.findSimilar('missing-svc')).rejects.toThrow(NotFoundException);
      expect(redisMock.get).not.toHaveBeenCalled();

      prismaMock.carService.findFirst.mockResolvedValueOnce(mockOriginalService({ status: 'ARCHIVED' }));
      await expect(service.findSimilar('svc-1', 8, undefined)).rejects.toThrow(NotFoundException);
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('applies same serviceType, same governorateId + priceFrom +-30% on narrow pass, then broadens to same serviceType across governorates', async () => {
      prismaMock.carService.findFirst.mockResolvedValueOnce(mockOriginalService());
      const narrowSvc = { id: 'svc-2', createdAt: new Date('2026-02-01'), priceFrom: '55' };
      const broaderSvc = { id: 'svc-3', createdAt: new Date('2026-02-02'), priceFrom: '120' };
      prismaMock.carService.findMany
        .mockResolvedValueOnce([narrowSvc])
        .mockResolvedValueOnce([broaderSvc]);

      const res = await service.findSimilar('svc-1', 2);
      expect(res.map((r: any) => r.id)).toEqual(['svc-2', 'svc-3']);

      const narrowCall = prismaMock.carService.findMany.mock.calls[0][0];
      expect(narrowCall.where).toMatchObject({
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        serviceType: 'MAINTENANCE',
        governorateId: 1,
        id: { not: 'svc-1' },
      });
      expect(narrowCall.where.priceFrom.gte.toNumber()).toBeCloseTo(35);
      expect(narrowCall.where.priceFrom.lte.toNumber()).toBeCloseTo(65);
      expect(narrowCall.include.user.select).not.toHaveProperty('phone');
      expect(narrowCall.include.user.select).not.toHaveProperty('email');
      expect(narrowCall.include._count).toEqual({ select: { images: true } });

      const broaderCall = prismaMock.carService.findMany.mock.calls[1][0];
      expect(broaderCall.where).toEqual({
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        serviceType: 'MAINTENANCE',
        id: { notIn: ['svc-1', 'svc-2'] },
      });

      expect(redisMock.set).toHaveBeenCalledWith('carService:similar:svc-1:2', res, 300);
    });

    it('invalidates carService:similar:* cache on create, update, remove, and toggleStatus', async () => {
      await service.create({ title: 'S', description: 'D', serviceType: 'MAINTENANCE', providerType: 'WORKSHOP', providerName: 'P', governorateId: 1, wilayaId: 1 } as any, 'user-1');
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:similar:*');

      redisMock.delPattern.mockClear();
      prismaMock.carService.findUnique.mockResolvedValue({ id: 'svc-1', userId: 'user-1', status: 'ACTIVE', version: 1, deletedAt: null });
      await service.update('svc-1', 'user-1', { title: 'U' } as any);
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:similar:*');

      redisMock.delPattern.mockClear();
      await service.toggleStatus('svc-1', 'user-1');
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:similar:*');

      redisMock.delPattern.mockClear();
      await service.remove('svc-1', 'user-1');
      expect(redisMock.delPattern).toHaveBeenCalledWith('carService:similar:*');
    });
  });
});
