import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('ContactService & ContactController', () => {
  let service: ContactService;
  let controller: ContactController;

  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
  };

  const sampleListing = {
    id: 'listing-101',
    sellerId: 'seller-user-1',
    status: ListingStatus.ACTIVE,
    whatsappEnabled: true,
  };

  const sampleSeller = {
    id: 'seller-user-1',
    phone: '+96891234567',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRedis.exists.mockResolvedValue(false);
    mockRedis.get.mockResolvedValue(0);
    mockRedis.set.mockResolvedValue(undefined);
    mockRedis.incr.mockResolvedValue(1);

    mockPrisma.listing.findUnique.mockResolvedValue(sampleListing);
    mockPrisma.user.findUnique.mockResolvedValue(sampleSeller);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        ContactService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    controller = module.get<ContactController>(ContactController);
  });

  describe('Validation & Entity checks', () => {
    it('throws NotFoundException for non-LISTING entityType in controller', async () => {
      await expect(
        controller.getContact('SERVICE', 'svc-1', { sub: 'viewer-1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-LISTING entityType in service', async () => {
      await expect(
        service.getContact('CAR', 'car-1', 'viewer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when listing is not found in database', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        service.getContact('LISTING', 'missing-id', 'viewer-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getContact('LISTING', 'missing-id', 'viewer-1'),
      ).rejects.toThrow('الإعلان غير موجود');
    });
  });

  describe('Visibility gate & Owner checks', () => {
    it('throws NotFoundException for a hidden listing to a non-owner', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce({
        ...sampleListing,
        status: ListingStatus.DRAFT,
      });

      await expect(
        service.getContact('LISTING', 'listing-101', 'other-viewer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when owner attempts to view their own contact', async () => {
      await expect(
        service.getContact('LISTING', 'listing-101', 'seller-user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getContact('LISTING', 'listing-101', 'seller-user-1'),
      ).rejects.toThrow('لا يمكنك عرض بيانات التواصل لإعلانك الخاص');
    });
  });

  describe('WhatsApp flag and phone normalization', () => {
    it('returns phone and whatsappNumber when whatsappEnabled is true', async () => {
      const result = await service.getContact('LISTING', 'listing-101', 'viewer-2');

      expect(result).toEqual({
        phone: '+96891234567',
        whatsappNumber: '+96891234567',
      });
    });

    it('returns phone and whatsappNumber: null when whatsappEnabled is false', async () => {
      mockPrisma.listing.findUnique.mockResolvedValueOnce({
        ...sampleListing,
        whatsappEnabled: false,
      });

      const result = await service.getContact('LISTING', 'listing-101', 'viewer-2');

      expect(result).toEqual({
        phone: '+96891234567',
        whatsappNumber: null,
      });
    });

    it('returns phone: null and whatsappNumber: null when seller has no phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'seller-user-1',
        phone: null,
      });

      const result = await service.getContact('LISTING', 'listing-101', 'viewer-2');

      expect(result).toEqual({
        phone: null,
        whatsappNumber: null,
      });
    });
  });

  describe('Daily distinct reveal cap (50/day)', () => {
    it('throws HttpException 429 when daily cap reaches 50', async () => {
      mockRedis.get.mockResolvedValueOnce(50);

      await expect(
        service.getContact('LISTING', 'listing-101', 'viewer-2'),
      ).rejects.toThrow(HttpException);

      try {
        mockRedis.get.mockResolvedValueOnce(50);
        await service.getContact('LISTING', 'listing-101', 'viewer-2');
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.message).toContain('50 إعلاناً');
      }
    });

    it('does not increment counter on repeat request for the same listing on the same day', async () => {
      // First request: not revealed yet
      mockRedis.exists.mockResolvedValueOnce(true); // already revealed today

      const result = await service.getContact('LISTING', 'listing-101', 'viewer-2');

      expect(result.phone).toBe('+96891234567');
      expect(mockRedis.incr).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('increments counter and marks member key on first request for listing today', async () => {
      mockRedis.exists.mockResolvedValueOnce(false);
      mockRedis.get.mockResolvedValueOnce(10);

      await service.getContact('LISTING', 'listing-101', 'viewer-2');

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('contact-cap:viewer-2:'),
        '1',
        86400,
      );
      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('contact-cap:viewer-2:'),
        86400,
      );
    });
  });

  describe('Controller response headers and metadata', () => {
    it('has Cache-Control: no-store metadata on getContact handler', () => {
      const headers = Reflect.getMetadata('__headers__', ContactController.prototype.getContact);
      expect(headers).toEqual(
        expect.arrayContaining([{ name: 'Cache-Control', value: 'no-store' }]),
      );
    });

    it('delegates to contactService from controller', async () => {
      const result = await controller.getContact('LISTING', 'listing-101', { sub: 'viewer-2' } as any);
      expect(result).toEqual({
        phone: '+96891234567',
        whatsappNumber: '+96891234567',
      });
    });
  });
});
