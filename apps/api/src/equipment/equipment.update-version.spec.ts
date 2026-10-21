import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EquipmentListingsService } from './equipment-listings.service';
import { UpdateEquipmentListingDto } from './dto/update-equipment-listing.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

describe('EquipmentListingsService - Optimistic Concurrency (version)', () => {
  let service: EquipmentListingsService;
  let prismaMock: any;

  const existing = {
    id: 'eq-1',
    userId: 'owner-1',
    status: 'ACTIVE',
    version: 3,
    title: 'Bulldozer CAT D6',
    listingType: 'EQUIPMENT_SALE',
    equipmentType: 'BULLDOZER',
    governorateId: null,
    wilayaId: null,
  };

  beforeEach(async () => {
    prismaMock = {
      equipmentListing: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue({ ...existing, version: 4, title: 'new title' }),
      },
      equipmentListingStatusLog: {
        create: jest.fn(),
      },
      outboxEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prismaMock)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn(), syncLocation: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = moduleRef.get<EquipmentListingsService>(EquipmentListingsService);
  });

  it('stale version (older than stored) -> 409 Conflict and nothing is updated', async () => {
    await expect(
      service.update('eq-1', 'owner-1', { version: 2, title: 'x' } as any),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.equipmentListing.update).not.toHaveBeenCalled();
    expect(prismaMock.outboxEvent.create).not.toHaveBeenCalled();
  });

  it('future version mismatch -> 409 Conflict', async () => {
    await expect(
      service.update('eq-1', 'owner-1', { version: 5, title: 'x' } as any),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.equipmentListing.update).not.toHaveBeenCalled();
  });

  it('matching version -> guarded UPDATE with version in WHERE and increment in data', async () => {
    await service.update('eq-1', 'owner-1', { version: 3, title: 'new title' } as any);

    const callArg = prismaMock.equipmentListing.update.mock.calls[0][0];
    expect(callArg.where).toEqual({ id: 'eq-1', version: 3 });
    expect(callArg.data.version).toEqual({ increment: 1 });
    expect(callArg.data.title).toBe('new title');
  });

  it('the client-sent version is never written as a plain value into data', async () => {
    await service.update('eq-1', 'owner-1', { version: 3, title: 'new title' } as any);
    expect(prismaMock.equipmentListing.update.mock.calls[0][0].data.version).not.toBe(3);
  });

  it('race condition: P2025 from guarded UPDATE is mapped to 409 ConflictException', async () => {
    prismaMock.equipmentListing.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      }),
    );

    await expect(
      service.update('eq-1', 'owner-1', { version: 3, title: 'x' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('other database errors are not swallowed', async () => {
    prismaMock.equipmentListing.update.mockRejectedValue(new Error('db connection lost'));

    await expect(
      service.update('eq-1', 'owner-1', { version: 3, title: 'x' } as any),
    ).rejects.toThrow('db connection lost');
  });

  it('version-less call (backward compatibility with legacy mobile app) succeeds and increments version', async () => {
    const res = await service.update('eq-1', 'owner-1', { title: 'updated title without version' });

    expect(res.version).toBe(4);
    const callArg = prismaMock.equipmentListing.update.mock.calls[0][0];
    expect(callArg.where).toEqual({ id: 'eq-1' });
    expect(callArg.data.version).toEqual({ increment: 1 });
    expect(callArg.data.title).toBe('updated title without version');
  });

  it('version: null payload is treated as omitted (does not throw 409)', async () => {
    const res = await service.update('eq-1', 'owner-1', { version: null as any, title: 'updated with null version' });
    expect(res.version).toBe(4);
    const callArg = prismaMock.equipmentListing.update.mock.calls[0][0];
    expect(callArg.where).toEqual({ id: 'eq-1' });
    expect(callArg.data.version).toEqual({ increment: 1 });
  });

  it('returns the updated record carrying the incremented version', async () => {
    const res = await service.update('eq-1', 'owner-1', { version: 3, title: 'new title' } as any);
    expect(res.version).toBe(4);
  });
});

describe('UpdateEquipmentListingDto.version validation', () => {
  it('is optional (legacy clients can omit it)', async () => {
    const dto = plainToInstance(UpdateEquipmentListingDto, { title: 'Valid Title Here' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'version')).toBe(false);
  });

  it('accepts a valid positive integer version', async () => {
    for (const v of [1, 2, 10, '5']) {
      const dto = plainToInstance(UpdateEquipmentListingDto, { version: v });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'version')).toBe(false);
    }
  });

  it('rejects invalid versions (< 1, non-integers, invalid strings)', async () => {
    for (const v of [0, -1, 1.5, 'invalid']) {
      const dto = plainToInstance(UpdateEquipmentListingDto, { version: v });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'version')).toBe(true);
    }
  });
});
