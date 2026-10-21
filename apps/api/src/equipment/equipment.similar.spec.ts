import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentListingsService } from './equipment-listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';
import { PUBLIC_ROUTES_ALLOWLIST } from '../common/constants/public-routes.allowlist';

describe('EquipmentListingsService.findSimilar (Task EB4)', () => {
  let service: EquipmentListingsService;
  let prismaMock: any;

  const mockOriginal = (overrides: Record<string, any> = {}) => ({
    id: 'eq-1',
    status: 'ACTIVE',
    userId: 'owner-1',
    hiddenByOwnerStatus: false,
    deletedAt: null,
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    make: 'CAT',
    year: 2020,
    price: '50000',
    dailyPrice: null,
    ...overrides,
  });

  beforeEach(async () => {
    prismaMock = {
      equipmentListing: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') return cb(prismaMock);
        if (Array.isArray(cb)) return Promise.all(cb);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn() } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(EquipmentListingsService);
  });

  describe('1. Allowlist and route entry', () => {
    it('PUBLIC_ROUTES_ALLOWLIST includes GET /equipment/:id/similar', () => {
      expect(PUBLIC_ROUTES_ALLOWLIST).toContain('GET /equipment/:id/similar');
    });
  });

  describe('2. Visibility and Gate Validation', () => {
    it('throws 404 when original listing does not exist', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(null);

      await expect(service.findSimilar('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when original listing is soft-deleted', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(null);

      await expect(service.findSimilar('eq-1')).rejects.toThrow(NotFoundException);
      expect(prismaMock.equipmentListing.findFirst).toHaveBeenCalledWith({
        where: { id: 'eq-1', deletedAt: null },
        select: expect.any(Object),
      });
    });

    it.each(['DRAFT', 'ARCHIVED', 'SUSPENDED'])(
      'throws 404 for visitor when original listing status is %s',
      async (status) => {
        prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(mockOriginal({ status }));

        await expect(service.findSimilar('eq-1', 8, undefined)).rejects.toThrow(NotFoundException);
      },
    );

    it('allows owner to query similar for own inactive listing', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(
        mockOriginal({ status: 'ARCHIVED', userId: 'owner-1' }),
      );
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      const result = await service.findSimilar('eq-1', 8, { sub: 'owner-1', role: 'USER' });
      expect(result).toEqual([]);
    });
  });

  describe('3. Limit clamp boundaries', () => {
    it.each([
      [0, 8],
      [1, 1],
      [20, 20],
      [99, 20],
      [NaN, 8],
    ])('clamps requested limit %s to %s', async (inputLimit, expectedLimit) => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(mockOriginal());
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      await service.findSimilar('eq-1', inputLimit as any);

      expect(prismaMock.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expectedLimit * 3, // Candidate pool multiplier
        }),
      );
    });
  });

  describe('4. Candidate filtering and ranking', () => {
    it('filters candidates by ACTIVE, not deleted, not self, same equipmentType and listingType', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(mockOriginal());
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      await service.findSimilar('eq-1', 8);

      const firstCall = prismaMock.equipmentListing.findMany.mock.calls[0][0];
      expect(firstCall.where).toMatchObject({
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        equipmentType: 'EXCAVATOR',
        listingType: 'EQUIPMENT_SALE',
        id: { not: 'eq-1' },
      });
    });

    it('applies make, year +-3, and price +-30% on narrow pass for sale listing', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(
        mockOriginal({ make: 'Komatsu', year: 2018, price: '40000' }),
      );
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      await service.findSimilar('eq-1', 8);

      const firstCall = prismaMock.equipmentListing.findMany.mock.calls[0][0];
      expect(firstCall.where.make).toEqual({ equals: 'Komatsu', mode: 'insensitive' });
      expect(firstCall.where.year).toEqual({ gte: 2015, lte: 2021 });
      expect(firstCall.where.price.gte.toNumber()).toBeCloseTo(28000);
      expect(firstCall.where.price.lte.toNumber()).toBeCloseTo(52000);
    });

    it('EQUIPMENT_RENT compares dailyPrice instead of price', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(
        mockOriginal({
          listingType: 'EQUIPMENT_RENT',
          price: null,
          dailyPrice: '100',
        }),
      );
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      await service.findSimilar('eq-1', 8);

      const firstCall = prismaMock.equipmentListing.findMany.mock.calls[0][0];
      expect(firstCall.where.listingType).toBe('EQUIPMENT_RENT');
      expect(firstCall.where.dailyPrice.gte.toNumber()).toBeCloseTo(70);
      expect(firstCall.where.dailyPrice.lte.toNumber()).toBeCloseTo(130);
      expect(firstCall.where.price).toBeUndefined();
    });

    it('EQUIPMENT_WANTED listings do not apply make, year, or price ranking', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(
        mockOriginal({
          listingType: 'EQUIPMENT_WANTED',
          price: null,
          dailyPrice: null,
          make: null,
          year: null,
        }),
      );
      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([]);

      await service.findSimilar('eq-1', 8);

      const firstCall = prismaMock.equipmentListing.findMany.mock.calls[0][0];
      expect(firstCall.where.listingType).toBe('EQUIPMENT_WANTED');
      expect(firstCall.where.make).toBeUndefined();
      expect(firstCall.where.year).toBeUndefined();
      expect(firstCall.where.price).toBeUndefined();
      expect(firstCall.where.dailyPrice).toBeUndefined();
    });

    it('orders narrow results before broader fallback results', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(mockOriginal({ make: 'CAT', price: '50000' }));

      const narrowItem = {
        id: 'eq-narrow',
        createdAt: new Date('2026-01-01'),
        make: 'CAT',
        year: 2020,
        price: '50000',
        user: { id: 'u1', username: 'seller1' },
      };
      const broaderItem = {
        id: 'eq-broader',
        createdAt: new Date('2026-01-02'),
        make: 'CAT',
        year: 2010,
        price: '90000',
        user: { id: 'u2', username: 'seller2' },
      };

      // First pass returns narrowItem (< limit 2)
      prismaMock.equipmentListing.findMany
        .mockResolvedValueOnce([narrowItem])
        .mockResolvedValueOnce([broaderItem]);

      const results = await service.findSimilar('eq-1', 2);
      expect(results.map((r: any) => r.id)).toEqual(['eq-narrow', 'eq-broader']);
    });

    it('returned items do not contain sensitive seller contactPhone or whatsapp fields', async () => {
      prismaMock.equipmentListing.findFirst.mockResolvedValueOnce(mockOriginal());

      const itemWithPublicUser = {
        id: 'eq-2',
        createdAt: new Date(),
        price: '50000',
        user: {
          id: 'u2',
          username: 'seller2',
          displayName: 'Seller',
          avatarUrl: null,
          isVerified: true,
          governorate: 'Muscat',
          createdAt: new Date(),
        },
      };

      prismaMock.equipmentListing.findMany.mockResolvedValueOnce([itemWithPublicUser]);

      const results = await service.findSimilar('eq-1', 4);
      expect(results[0].user).not.toHaveProperty('phone');
      expect(results[0].user).not.toHaveProperty('contactPhone');
      expect(results[0].user).not.toHaveProperty('whatsapp');
    });
  });
});
