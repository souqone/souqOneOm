import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('Contact endpoint - BUS_LISTING', () => {
  let service: ContactService;
  let controller: ContactController;

  const mockPrisma = {
    listing: { findUnique: jest.fn() },
    busListing: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const mockRedis = {
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
  };

  const bus = {
    id: 'bus-1',
    userId: 'owner-1',
    status: ListingStatus.ACTIVE,
    whatsappEnabled: true,
  };
  const viewer = { sub: 'viewer-1' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.exists.mockResolvedValue(false);
    mockRedis.get.mockResolvedValue(0);
    mockRedis.set.mockResolvedValue(undefined);
    mockRedis.incr.mockResolvedValue(1);
    mockPrisma.busListing.findFirst.mockResolvedValue(bus);
    mockPrisma.user.findUnique.mockResolvedValue({ phone: '+96893333333' });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        ContactService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get(ContactService);
    controller = module.get(ContactController);
  });

  it('controller accepts BUS_LISTING and reads from prisma.busListing (not prisma.listing)', async () => {
    const res = await controller.getContact('BUS_LISTING', 'bus-1', viewer);
    // owner's ACCOUNT phone, same as cars (bus listings have no phone columns of their own)
    expect(res).toEqual({ phone: '+96893333333', whatsappNumber: '+96893333333' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'owner-1' } }),
    );
    expect(mockPrisma.busListing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'bus-1', deletedAt: null } }),
    );
    expect(mockPrisma.listing.findUnique).not.toHaveBeenCalled();
  });

  it('controller still rejects unknown entity types with 404', async () => {
    await expect(controller.getContact('JOB', 'x', viewer)).rejects.toThrow(NotFoundException);
    await expect(controller.getContact('bus_listing', 'x', viewer)).rejects.toThrow(NotFoundException);
  });

  it('whatsappEnabled=false -> whatsappNumber is null, phone still returned', async () => {
    mockPrisma.busListing.findFirst.mockResolvedValue({ ...bus, whatsappEnabled: false });
    const res = await service.getContact('BUS_LISTING', 'bus-1', 'viewer-1');
    expect(res.whatsappNumber).toBeNull();
    expect(res.phone).toBe('+96893333333');
  });

  it('selects only ownership/visibility/whatsappEnabled from the bus (no phone columns)', async () => {
    await service.getContact('BUS_LISTING', 'bus-1', 'viewer-1');
    const select = mockPrisma.busListing.findFirst.mock.calls[0][0].select;
    expect(Object.keys(select).sort()).toEqual(['id', 'status', 'userId', 'whatsappEnabled']);
  });

  it('owner without a phone -> phone and whatsappNumber are null', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ phone: null });
    const res = await service.getContact('BUS_LISTING', 'bus-1', 'viewer-1');
    expect(res).toEqual({ phone: null, whatsappNumber: null });
  });

  it.each([ListingStatus.DRAFT, ListingStatus.ARCHIVED, ListingStatus.SUSPENDED])(
    'hidden status %s -> 404 for a non-owner',
    async (status) => {
      mockPrisma.busListing.findFirst.mockResolvedValue({ ...bus, status });
      await expect(service.getContact('BUS_LISTING', 'bus-1', 'viewer-1')).rejects.toThrow(NotFoundException);
    },
  );

  it('unknown / soft-deleted bus -> 404', async () => {
    mockPrisma.busListing.findFirst.mockResolvedValue(null);
    await expect(service.getContact('BUS_LISTING', 'nope', 'viewer-1')).rejects.toThrow(NotFoundException);
  });

  it('owner viewing their own bus -> 400 (same rule as cars)', async () => {
    await expect(service.getContact('BUS_LISTING', 'bus-1', 'owner-1')).rejects.toThrow(BadRequestException);
  });

  it('daily reveal cap (50) applies to buses too -> 429', async () => {
    mockRedis.get.mockResolvedValue(50);
    await expect(service.getContact('BUS_LISTING', 'bus-1', 'viewer-1')).rejects.toThrow(HttpException);
  });

  it('rate limit decorator (5 / 60s) is on the handler that now serves BUS_LISTING', () => {
    const handler = ContactController.prototype.getContact;
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60000);
  });

  it('cars LISTING path is unchanged (still reads prisma.listing, seller phone)', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: 'l1', sellerId: 'seller-1', status: ListingStatus.ACTIVE, whatsappEnabled: true,
    });
    mockPrisma.user.findUnique.mockResolvedValue({ phone: '+96891234567' });
    const res = await service.getContact('LISTING', 'l1', 'viewer-1');
    expect(res).toEqual({ phone: '+96891234567', whatsappNumber: '+96891234567' });
    expect(mockPrisma.busListing.findFirst).not.toHaveBeenCalled();
  });
});
