import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UploadsController } from '../uploads.controller';
import { UploadsService } from '../uploads.service';
import { UploadImageManagerService } from '../upload-image-manager.service';
import { UploadFileStorageService } from '../upload-file-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { RedisService } from '../../redis/redis.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('B9 (D-263): Equipment & Bus Image URL Attach and Deletion Endpoints', () => {
  let controller: UploadsController;
  let uploadsService: UploadsService;
  const originalEnv = process.env;

  const mockUser = { sub: 'owner-1', email: 'owner@example.com', username: 'owner', role: 'USER' };
  const trustedUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/vehicle.jpg';

  const mockPrisma = {
    equipmentListing: { findFirst: jest.fn() },
    equipmentListingImage: {
      count: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    busListing: { findFirst: jest.fn() },
    busListingImage: {
      count: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStorage = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockCloudinary = {
    upload: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockRedis = {
    del: jest.fn().mockResolvedValue(1),
    delPattern: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'production', CLOUDINARY_CLOUD_NAME: 'souqone' };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        UploadsService,
        UploadImageManagerService,
        { provide: UploadFileStorageService, useValue: mockStorage },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    uploadsService = module.get<UploadsService>(UploadsService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Route Guards & Throttling', () => {
    it.each([
      'addBusImageByUrl',
      'removeBusImage',
      'addEquipmentImageByUrl',
      'removeEquipmentImage',
    ] as const)('%s enforces JwtAuthGuard and 30 req/min throttle', (handlerName) => {
      const handler = UploadsController.prototype[handlerName];
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) || [];
      expect(guards).toContain(JwtAuthGuard);
      expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(30);
      expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60000);
    });
  });

  describe('1. Attach image to valid equipment with trusted URL', () => {
    it('creates equipment image, marks first image primary automatically, and returns ID + isPrimary', async () => {
      mockPrisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'owner-1',
        deletedAt: null,
      });
      mockPrisma.equipmentListingImage.count.mockResolvedValue(0);
      mockPrisma.equipmentListingImage.aggregate.mockResolvedValue({ _max: { order: null } });
      mockPrisma.equipmentListingImage.create.mockResolvedValue({
        id: 'eq-img-1',
        url: trustedUrl,
        order: 0,
        isPrimary: true,
        equipmentListingId: 'eq-1',
      });

      const result = await controller.addEquipmentImageByUrl('eq-1', { url: trustedUrl }, mockUser as any);

      expect(result).toMatchObject({ id: 'eq-img-1', isPrimary: true, url: trustedUrl });
      expect(mockPrisma.equipmentListingImage.create).toHaveBeenCalledWith({
        data: { url: trustedUrl, order: 0, isPrimary: true, equipmentListingId: 'eq-1' },
      });
    });

    it('unsets existing primary images when isPrimary is explicitly true', async () => {
      mockPrisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'owner-1',
        deletedAt: null,
      });
      mockPrisma.equipmentListingImage.count.mockResolvedValue(2);
      mockPrisma.equipmentListingImage.aggregate.mockResolvedValue({ _max: { order: 1 } });
      mockPrisma.equipmentListingImage.create.mockResolvedValue({
        id: 'eq-img-3',
        url: trustedUrl,
        order: 2,
        isPrimary: true,
        equipmentListingId: 'eq-1',
      });

      const result = await controller.addEquipmentImageByUrl(
        'eq-1',
        { url: trustedUrl, isPrimary: true },
        mockUser as any,
      );

      expect(result.isPrimary).toBe(true);
      expect(mockPrisma.equipmentListingImage.updateMany).toHaveBeenCalledWith({
        where: { equipmentListingId: 'eq-1' },
        data: { isPrimary: false },
      });
    });
  });

  describe('2. Attach image to another user equipment -> 403 Forbidden', () => {
    it('rejects non-owner with ForbiddenException', async () => {
      mockPrisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'different-user',
        deletedAt: null,
      });

      await expect(
        controller.addEquipmentImageByUrl('eq-1', { url: trustedUrl }, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Untrusted or invalid image URL -> 400 Bad Request', () => {
    it('rejects untrusted URLs for both equipment and buses before querying DB', async () => {
      const spyEquip = jest.spyOn(uploadsService, 'addImageToEquipment');
      const spyBus = jest.spyOn(uploadsService, 'addImageToBus');

      await expect(
        controller.addEquipmentImageByUrl('eq-1', { url: 'https://evil.com/x.jpg' }, mockUser as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.addBusImageByUrl('bus-1', { url: 'not-a-url' }, mockUser as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.addBusImageByUrl(
          'bus-1',
          { url: 'https://res.cloudinary.com/other-cloud/image/upload/x.jpg' },
          mockUser as any,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(spyEquip).not.toHaveBeenCalled();
      expect(spyBus).not.toHaveBeenCalled();
    });
  });

  describe('4. Exceeding max 10 images limit -> 400 Bad Request', () => {
    it('throws BadRequestException when equipment already has 10 images', async () => {
      mockPrisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'owner-1',
        deletedAt: null,
      });
      mockPrisma.equipmentListingImage.count.mockResolvedValue(10);

      await expect(
        controller.addEquipmentImageByUrl('eq-1', { url: trustedUrl }, mockUser as any),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.equipmentListingImage.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when bus already has 10 images', async () => {
      mockPrisma.busListing.findFirst.mockResolvedValue({
        id: 'bus-1',
        userId: 'owner-1',
        deletedAt: null,
      });
      mockPrisma.busListingImage.count.mockResolvedValue(10);

      await expect(
        controller.addBusImageByUrl('bus-1', { url: trustedUrl }, mockUser as any),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.busListingImage.create).not.toHaveBeenCalled();
    });
  });

  describe('5. Attach image to valid bus with trusted URL', () => {
    it('creates bus image, sets primary on first upload, and invalidates bus caches', async () => {
      mockPrisma.busListing.findFirst.mockResolvedValue({
        id: 'bus-1',
        userId: 'owner-1',
        deletedAt: null,
      });
      mockPrisma.busListingImage.count.mockResolvedValue(0);
      mockPrisma.busListingImage.aggregate.mockResolvedValue({ _max: { order: null } });
      mockPrisma.busListingImage.create.mockResolvedValue({
        id: 'bus-img-1',
        url: trustedUrl,
        order: 0,
        isPrimary: true,
        busListingId: 'bus-1',
      });

      const result = await controller.addBusImageByUrl('bus-1', { url: trustedUrl }, mockUser as any);

      expect(result).toMatchObject({ id: 'bus-img-1', isPrimary: true, busListingId: 'bus-1' });
      expect(mockRedis.del).toHaveBeenCalledWith('busListing:detail:bus-1');
      expect(mockRedis.delPattern).toHaveBeenCalledWith('busListing:list:*');
      expect(mockRedis.delPattern).toHaveBeenCalledWith('busListing:similar:*');
      expect(mockRedis.delPattern).toHaveBeenCalledWith('busListing:slug:*');
    });
  });

  describe('6. Delete equipment / bus image by owner -> succeeds', () => {
    it('deletes primary equipment image, cleans stored file, and promotes next remaining image', async () => {
      const managedUrl = 'https://res.cloudinary.com/souqone/image/upload/v123/carone/listings/eq.jpg';
      mockPrisma.equipmentListingImage.findUnique.mockResolvedValue({
        id: 'eq-img-1',
        url: managedUrl,
        isPrimary: true,
        equipmentListing: { id: 'eq-1', userId: 'owner-1', deletedAt: null },
      });
      mockPrisma.equipmentListingImage.delete.mockResolvedValue({ id: 'eq-img-1' });
      mockPrisma.equipmentListingImage.findFirst.mockResolvedValue({ id: 'eq-img-2' });
      mockPrisma.equipmentListingImage.update.mockResolvedValue({ id: 'eq-img-2', isPrimary: true });

      const result = await controller.removeEquipmentImage('eq-img-1', mockUser as any);

      expect(result).toEqual({ message: 'تم حذف الصورة بنجاح' });
      expect(mockStorage.deleteFile).toHaveBeenCalledWith('carone/listings/eq');
      expect(mockPrisma.equipmentListingImage.delete).toHaveBeenCalledWith({ where: { id: 'eq-img-1' } });
      expect(mockPrisma.equipmentListingImage.update).toHaveBeenCalledWith({
        where: { id: 'eq-img-2' },
        data: { isPrimary: true },
      });
    });

    it('deletes bus image by owner and invalidates bus Redis caches', async () => {
      mockPrisma.busListingImage.findUnique.mockResolvedValue({
        id: 'bus-img-1',
        url: trustedUrl,
        isPrimary: false,
        busListing: { id: 'bus-1', userId: 'owner-1', deletedAt: null },
      });
      mockPrisma.busListingImage.delete.mockResolvedValue({ id: 'bus-img-1' });

      const result = await controller.removeBusImage('bus-img-1', mockUser as any);

      expect(result).toEqual({ message: 'تم حذف الصورة بنجاح' });
      expect(mockPrisma.busListingImage.delete).toHaveBeenCalledWith({ where: { id: 'bus-img-1' } });
      expect(mockRedis.del).toHaveBeenCalledWith('busListing:detail:bus-1');
    });
  });

  describe('7. Delete equipment / bus image by another user -> 403 Forbidden (and 404 when missing/deleted)', () => {
    it('rejects deleting another user equipment image with ForbiddenException', async () => {
      mockPrisma.equipmentListingImage.findUnique.mockResolvedValue({
        id: 'eq-img-1',
        url: trustedUrl,
        isPrimary: false,
        equipmentListing: { id: 'eq-1', userId: 'other-user', deletedAt: null },
      });

      await expect(controller.removeEquipmentImage('eq-img-1', mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.equipmentListingImage.delete).not.toHaveBeenCalled();
    });

    it('rejects deleting another user bus image with ForbiddenException', async () => {
      mockPrisma.busListingImage.findUnique.mockResolvedValue({
        id: 'bus-img-1',
        url: trustedUrl,
        isPrimary: false,
        busListing: { id: 'bus-1', userId: 'other-user', deletedAt: null },
      });

      await expect(controller.removeBusImage('bus-img-1', mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.busListingImage.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when bus or equipment image parent is soft-deleted or missing', async () => {
      mockPrisma.busListingImage.findUnique.mockResolvedValue(null);
      await expect(controller.removeBusImage('missing-img', mockUser as any)).rejects.toThrow(
        NotFoundException,
      );

      mockPrisma.equipmentListingImage.findUnique.mockResolvedValue({
        id: 'eq-img-1',
        url: trustedUrl,
        isPrimary: false,
        equipmentListing: { id: 'eq-1', userId: 'owner-1', deletedAt: new Date() },
      });
      await expect(controller.removeEquipmentImage('eq-img-1', mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
