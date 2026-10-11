import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusesService, stripNeverExposedFields } from './buses.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';

const prisma: any = {
  busListing: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
};
const redis: any = {
  get: jest.fn(), set: jest.fn().mockResolvedValue(undefined), setNX: jest.fn().mockResolvedValue(true),
  del: jest.fn(), delPattern: jest.fn(),
};

// contactPhone / whatsapp ARE filled in the database
const makeBus = (over: Record<string, any> = {}) => ({
  id: 'bus-1', slug: 'bus-slug', title: 'Bus', status: 'ACTIVE', userId: 'owner-1', deletedAt: null,
  year: 2020, capacity: 30, whatsappEnabled: true,
  contactPhone: '91111111', whatsapp: '92222222',
  contractClient: 'ACME', contractMonthly: '500', contractDuration: 12, contractExpiry: '2027-01-01T00:00:00.000Z',
  user: { id: 'owner-1', username: 'seller' },
  ...over,
});

const OTHER_FIELDS = ['id', 'slug', 'title', 'status', 'year', 'capacity', 'whatsappEnabled', 'user'];

describe('Bus detail response never contains listing-level contactPhone/whatsapp', () => {
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

  const expectNoListingPhone = (res: any) => {
    expect(res).not.toHaveProperty('contactPhone');
    expect(res).not.toHaveProperty('whatsapp');
    expect(JSON.stringify(res)).not.toContain('91111111');
    expect(JSON.stringify(res)).not.toContain('92222222');
  };

  it('signed-in member, findOne (DB path): fields are absent (not null)', async () => {
    prisma.busListing.findFirst.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findOne('bus-1', undefined, 'member-1'));
  });

  it('signed-in member, findOne (Redis cache path)', async () => {
    redis.get.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findOne('bus-1', undefined, 'member-1'));
  });

  it('signed-in member, findBySlug (DB + cache)', async () => {
    prisma.busListing.findFirst.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findBySlug('bus-slug', undefined, 'member-1'));
    redis.get.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findBySlug('bus-slug', undefined, 'member-1'));
  });

  it('the owner also does not get them in the detail response', async () => {
    prisma.busListing.findFirst.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findOne('bus-1', undefined, 'owner-1'));
  });

  it('visitor (still hidden after PR-2): fields absent', async () => {
    prisma.busListing.findFirst.mockResolvedValue(makeBus());
    expectNoListingPhone(await service.findOne('bus-1', undefined, undefined));
  });

  it('even if the Prisma query returned them, the response omits them (select is not relied on)', async () => {
    const record = makeBus();
    prisma.busListing.findFirst.mockResolvedValue(record);
    const res = await service.findOne('bus-1', undefined, 'member-1');
    expect(record).toHaveProperty('contactPhone'); // the DB record had both fields...
    expectNoListingPhone(res); // ...the response has neither
  });

  it('the rest of the detail response is untouched for a member (incl. contract data)', async () => {
    prisma.busListing.findFirst.mockResolvedValue(makeBus());
    const res: any = await service.findOne('bus-1', undefined, 'member-1');
    for (const f of OTHER_FIELDS) expect(res).toHaveProperty(f);
    expect(res.contractClient).toBe('ACME');
    expect(res.contractMonthly).toBe('500');
    expect(res.contractDuration).toBe(12);
    expect(res.contractExpiry).toBe('2027-01-01T00:00:00.000Z');
    expect(res.whatsappEnabled).toBe(true);
  });

  it('lists (findAll) omit them too', async () => {
    prisma.busListing.findMany.mockResolvedValue([makeBus()]);
    prisma.busListing.count.mockResolvedValue(1);
    const res: any = await service.findAll({} as any);
    expectNoListingPhone(res.items[0]);
  });

  it('stripNeverExposedFields removes only the two fields and does not mutate its input', () => {
    const input = makeBus();
    const out: any = stripNeverExposedFields(input);
    expect(out).not.toHaveProperty('contactPhone');
    expect(out).not.toHaveProperty('whatsapp');
    expect(out.contractClient).toBe('ACME');
    expect(input.contactPhone).toBe('91111111');
  });
});
