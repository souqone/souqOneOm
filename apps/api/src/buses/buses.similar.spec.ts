import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusesService } from './buses.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';
import { findSimilarListings, rankByPriceProximity } from '../common/utils/similar-listings.util';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';

describe('rankByPriceProximity / findSimilarListings (generic)', () => {
  const row = (id: string, price: number, createdAt: string) => ({ id, price, createdAt });

  it('orders by price closeness, ties by newest first', () => {
    const rows = [row('far', 900, '2026-01-01'), row('near-old', 1000, '2026-01-01'), row('near-new', 1000, '2026-02-01')];
    const out = rankByPriceProximity(rows, 1000, (r) => r.price).map((r) => r.id);
    expect(out).toEqual(['near-new', 'near-old', 'far']);
  });

  it('works with any delegate and tops up with the broader pass', async () => {
    const calls: any[] = [];
    const delegate = {
      findMany: jest.fn(async (args: any) => {
        calls.push(args);
        return calls.length === 1 ? [row('a', 100, '2026-01-01')] : [row('b', 500, '2026-01-02')];
      }),
    };
    const out = await findSimilarListings({
      delegate,
      excludeId: 'self',
      limit: 2,
      baseWhere: { status: 'ACTIVE' },
      narrowWhere: { make: 'x' },
      broaderWhere: { make: 'x' },
      referencePrice: 100,
      priceOf: (r) => r.price,
      query: { include: { images: true } },
    });
    expect(out.map((r) => r.id)).toEqual(['a', 'b']);
    expect(calls[0].where).toEqual({ status: 'ACTIVE', make: 'x', id: { not: 'self' } });
    expect(calls[1].where.id).toEqual({ notIn: ['self', 'a'] });
    expect(calls[1].take).toBe(1);
  });

  it('does not run the broader pass when the strict pass is full', async () => {
    const delegate = { findMany: jest.fn().mockResolvedValue([row('a', 1, '2026-01-01'), row('b', 2, '2026-01-01')]) };
    await findSimilarListings({
      delegate, excludeId: 's', limit: 2, baseWhere: {}, narrowWhere: {}, broaderWhere: {},
      referencePrice: 1, priceOf: (r) => r.price, query: {},
    });
    expect(delegate.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('BusesService.findSimilar', () => {
  const prisma: any = { busListing: { findFirst: jest.fn(), findMany: jest.fn() } };
  const redis: any = { get: jest.fn(), set: jest.fn().mockResolvedValue(undefined), delPattern: jest.fn(), del: jest.fn() };
  let service: BusesService;

  const original = (over: Record<string, any> = {}) => ({
    id: 'bus-1', status: 'ACTIVE', userId: 'owner-1',
    busListingType: 'BUS_SALE', busType: 'COASTER', make: 'Toyota', year: 2020,
    price: '10000', dailyPrice: null, ...over,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    prisma.busListing.findMany.mockResolvedValue([]);
    const mod = await Test.createTestingModule({
      providers: [
        BusesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    service = mod.get(BusesService);
  });

  it('404 for an unknown listing', async () => {
    prisma.busListing.findFirst.mockResolvedValue(null);
    await expect(service.findSimilar('x')).rejects.toThrow(NotFoundException);
  });

  it.each(['DRAFT', 'ARCHIVED', 'SUSPENDED'])('%s original -> 404 for visitors, and the cache is not consulted', async (status) => {
    prisma.busListing.findFirst.mockResolvedValue(original({ status }));
    await expect(service.findSimilar('bus-1', 8, undefined)).rejects.toThrow(NotFoundException);
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('sale: filters same type, ACTIVE only, +-30% on price, excludes itself', async () => {
    prisma.busListing.findFirst.mockResolvedValue(original());
    await service.findSimilar('bus-1', 4, undefined);
    const where = prisma.busListing.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      status: 'ACTIVE', deletedAt: null, busListingType: 'BUS_SALE', busType: 'COASTER', id: { not: 'bus-1' },
    });
    expect(where.price.gte.toNumber()).toBeCloseTo(7000);
    expect(where.price.lte.toNumber()).toBeCloseTo(13000);
    expect(where.dailyPrice).toBeUndefined();
  });

  it('rent: compares dailyPrice instead of price', async () => {
    prisma.busListing.findFirst.mockResolvedValue(original({ busListingType: 'BUS_RENT', price: null, dailyPrice: '50' }));
    await service.findSimilar('bus-1', 4, undefined);
    const where = prisma.busListing.findMany.mock.calls[0][0].where;
    expect(where.dailyPrice.gte.toNumber()).toBeCloseTo(35);
    expect(where.price).toBeUndefined();
  });

  it('strips members-only fields from returned cards and caches the result', async () => {
    prisma.busListing.findFirst.mockResolvedValue(original());
    prisma.busListing.findMany.mockResolvedValue([
      { id: 'b2', createdAt: '2026-01-01', price: '10000', contractClient: 'X', contractMonthly: '1', contractDuration: 1, contractExpiry: 'd' },
    ]);
    const res: any = await service.findSimilar('bus-1', 4, undefined);
    expect(res[0]).not.toHaveProperty('contractClient');
    expect(res[0]).not.toHaveProperty('contractMonthly');
    expect(redis.set).toHaveBeenCalledWith('busListing:similar:bus-1:4', res, 300);
  });

  it('caps the requested limit at 20', async () => {
    prisma.busListing.findFirst.mockResolvedValue(original());
    await service.findSimilar('bus-1', 500, undefined);
    expect(prisma.busListing.findMany.mock.calls[0][0].take).toBe(60); // 20 * 3 candidates
  });
});
