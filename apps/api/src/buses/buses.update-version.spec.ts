import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BusesService } from './buses.service';
import { UpdateBusListingDto } from './dto/update-bus-listing.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';

const prisma: any = {
  busListing: { findUnique: jest.fn(), update: jest.fn() },
  busListingStatusLog: { create: jest.fn() },
  busListingPriceHistory: { create: jest.fn() },
  outboxEvent: { create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(prisma)),
};
const redis: any = {
  get: jest.fn(), set: jest.fn(), del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
};

const existing = { id: 'bus-1', userId: 'owner-1', status: 'ACTIVE', version: 3, price: null, governorateId: null, wilayaId: null };

describe('BusesService.update - optimistic concurrency (version)', () => {
  let service: BusesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.busListing.findUnique.mockResolvedValue(existing);
    prisma.busListing.update.mockResolvedValue({ ...existing, version: 4, title: 'new' });
    const mod = await Test.createTestingModule({
      providers: [
        BusesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = mod.get(BusesService);
  });

  it('stale version (older than stored) -> 409 and nothing is written', async () => {
    await expect(service.update('bus-1', 'owner-1', { version: 2, title: 'x' } as any)).rejects.toThrow(ConflictException);
    expect(prisma.busListing.update).not.toHaveBeenCalled();
    expect(prisma.outboxEvent.create).not.toHaveBeenCalled();
    expect(redis.delPattern).not.toHaveBeenCalled();
  });

  it('matching version -> guarded UPDATE with version in WHERE and increment in data', async () => {
    await service.update('bus-1', 'owner-1', { version: 3, title: 'new' } as any);
    const arg = prisma.busListing.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'bus-1', version: 3 });
    expect(arg.data.version).toEqual({ increment: 1 });
    expect(arg.data.title).toBe('new');
  });

  it('the client-sent version is never written as a plain value', async () => {
    await service.update('bus-1', 'owner-1', { version: 3, title: 'new' } as any);
    expect(prisma.busListing.update.mock.calls[0][0].data.version).not.toBe(3);
  });

  it('race: P2025 from the guarded UPDATE is mapped to 409', async () => {
    prisma.busListing.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: 'x' }),
    );
    await expect(service.update('bus-1', 'owner-1', { version: 3, title: 'x' } as any)).rejects.toThrow(ConflictException);
  });

  it('other database errors are not swallowed', async () => {
    prisma.busListing.update.mockRejectedValue(new Error('db down'));
    await expect(service.update('bus-1', 'owner-1', { version: 3 } as any)).rejects.toThrow('db down');
  });

  it('returns the updated record carrying the incremented version', async () => {
    const res = await service.update('bus-1', 'owner-1', { version: 3, title: 'new' } as any);
    expect(res.version).toBe(4);
  });
});

describe('UpdateBusListingDto.version validation', () => {
  it('is required', async () => {
    const errors = await validate(plainToInstance(UpdateBusListingDto, { title: 'abc def' }));
    expect(errors.some((e) => e.property === 'version')).toBe(true);
  });
  it('rejects non-integers and values < 1', async () => {
    for (const v of [1.5, 0, -1, 'abc']) {
      const errors = await validate(plainToInstance(UpdateBusListingDto, { version: v }));
      expect(errors.some((e) => e.property === 'version')).toBe(true);
    }
  });
  it('accepts a positive integer (also numeric string from JSON-ish clients)', async () => {
    for (const v of [1, 7, '7']) {
      const errors = await validate(plainToInstance(UpdateBusListingDto, { version: v }));
      expect(errors.some((e) => e.property === 'version')).toBe(false);
    }
  });
});

describe('Slug cache invalidation', () => {
  let service: BusesService;
  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.busListing.findUnique.mockResolvedValue(existing);
    prisma.busListing.update.mockResolvedValue({ ...existing, version: 4 });
    const mod = await Test.createTestingModule({
      providers: [
        BusesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = mod.get(BusesService);
  });

  it('update invalidates slug keys with SCAN-based delPattern (not a literal del of "*")', async () => {
    await service.update('bus-1', 'owner-1', { version: 3, title: 'x' } as any);
    expect(redis.delPattern).toHaveBeenCalledWith('busListing:slug:*');
    expect(redis.del).not.toHaveBeenCalledWith('busListing:slug:*');
    expect(redis.del).toHaveBeenCalledWith('busListing:detail:bus-1');
  });

  it('update also drops cached similar lists and list pages', async () => {
    await service.update('bus-1', 'owner-1', { version: 3, title: 'x' } as any);
    expect(redis.delPattern).toHaveBeenCalledWith('busListing:similar:*');
    expect(redis.delPattern).toHaveBeenCalledWith('busListing:list:*');
  });
});
