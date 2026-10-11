import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusesService, stripMembersOnlyFields } from './buses.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';
import { USER_SELECT_LISTING_PUBLIC } from '../common/constants/user-select.constant';

const prisma: any = {
  busListing: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
};
const redis: any = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  setNX: jest.fn().mockResolvedValue(true),
  del: jest.fn(),
  delPattern: jest.fn(),
};

const OWNER = 'owner-1';
const makeBus = (over: Record<string, any> = {}) => ({
  id: 'bus-1',
  slug: 'bus-slug',
  title: 'Bus',
  status: 'ACTIVE',
  userId: OWNER,
  deletedAt: null,
  contactPhone: '96890000000',
  whatsapp: '96890000001',
  contractClient: 'ACME',
  contractMonthly: '500',
  contractDuration: 12,
  contractExpiry: '2027-01-01T00:00:00.000Z',
  user: { id: OWNER, username: 'seller' },
  ...over,
});

const SENSITIVE = ['contactPhone', 'whatsapp', 'contractClient', 'contractMonthly', 'contractDuration', 'contractExpiry'];

describe('BusesService detail - visibility gate and privacy', () => {
  let service: BusesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    const mod = await Test.createTestingModule({
      providers: [
        BusesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = mod.get(BusesService);
  });

  describe.each(['DRAFT', 'ARCHIVED', 'SUSPENDED'])('status %s', (status) => {
    it('findOne -> 404 for a visitor (DB path)', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus({ status }));
      await expect(service.findOne('bus-1', '1.1.1.1', undefined)).rejects.toThrow(NotFoundException);
      expect(prisma.busListing.update).not.toHaveBeenCalled(); // no view counted
    });

    it('findOne -> 404 for a visitor even when served from the Redis cache', async () => {
      redis.get.mockResolvedValue(makeBus({ status }));
      await expect(service.findOne('bus-1', '1.1.1.1', undefined)).rejects.toThrow(NotFoundException);
      expect(redis.setNX).not.toHaveBeenCalled();
    });

    it('findBySlug -> 404 for a non-owner viewer', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus({ status }));
      await expect(service.findBySlug('bus-slug', '1.1.1.1', 'other-user')).rejects.toThrow(NotFoundException);
    });

    it('findBySlug -> 404 for a visitor from cache', async () => {
      redis.get.mockResolvedValue(makeBus({ status }));
      await expect(service.findBySlug('bus-slug', undefined, undefined)).rejects.toThrow(NotFoundException);
    });

    it('owner can still open their own listing', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus({ status }));
      const res = await service.findOne('bus-1', undefined, OWNER);
      expect(res.id).toBe('bus-1');
    });
  });

  it('soft-deleted listing from cache -> 404', async () => {
    redis.get.mockResolvedValue(makeBus({ deletedAt: '2026-01-01T00:00:00.000Z' }));
    await expect(service.findOne('bus-1', undefined, OWNER)).rejects.toThrow(NotFoundException);
  });

  describe('members-only fields (phone / WhatsApp / contract)', () => {
    it('are removed for a visitor (findOne)', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus());
      const res: any = await service.findOne('bus-1', undefined, undefined);
      for (const f of SENSITIVE) expect(res).not.toHaveProperty(f);
      expect(res.title).toBe('Bus');
    });

    it('are removed for a visitor (findBySlug, cached)', async () => {
      redis.get.mockResolvedValue(makeBus());
      const res: any = await service.findBySlug('bus-slug', undefined, undefined);
      for (const f of SENSITIVE) expect(res).not.toHaveProperty(f);
    });

    it('are present for ANY signed-in viewer, not only the owner', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus());
      const res: any = await service.findOne('bus-1', undefined, 'some-other-member');
      for (const f of SENSITIVE) expect(res).toHaveProperty(f);
    });

    it('stripping does not mutate the cached object', async () => {
      const cached = makeBus();
      redis.get.mockResolvedValue(cached);
      await service.findOne('bus-1', undefined, undefined);
      for (const f of SENSITIVE) expect(cached).toHaveProperty(f);
    });

    it('stripMembersOnlyFields leaves other fields intact', () => {
      const out: any = stripMembersOnlyFields(makeBus());
      expect(out.slug).toBe('bus-slug');
      expect(out.user).toBeDefined();
    });
  });

  describe('seller object (no phone)', () => {
    it('findOne selects USER_SELECT_LISTING_PUBLIC', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus());
      await service.findOne('bus-1', undefined, undefined);
      const arg = prisma.busListing.findFirst.mock.calls[0][0];
      expect(arg.include.user.select).toBe(USER_SELECT_LISTING_PUBLIC);
      expect(arg.include.user.select).not.toHaveProperty('phone');
    });

    it('findBySlug selects USER_SELECT_LISTING_PUBLIC', async () => {
      prisma.busListing.findFirst.mockResolvedValue(makeBus());
      await service.findBySlug('bus-slug', undefined, undefined);
      expect(prisma.busListing.findFirst.mock.calls[0][0].include.user.select).toBe(USER_SELECT_LISTING_PUBLIC);
    });

    it('findAll selects USER_SELECT_LISTING_PUBLIC and strips members-only fields for everyone', async () => {
      prisma.busListing.findMany.mockResolvedValue([makeBus()]);
      prisma.busListing.count.mockResolvedValue(1);
      const res: any = await service.findAll({} as any);
      expect(prisma.busListing.findMany.mock.calls[0][0].include.user.select).toBe(USER_SELECT_LISTING_PUBLIC);
      for (const f of SENSITIVE) expect(res.items[0]).not.toHaveProperty(f);
    });
  });
});
