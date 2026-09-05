import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentListingsService } from './equipment-listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GeoService } from '../locations/geo.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('EquipmentListingsService - Image Handling', () => {
  let service: EquipmentListingsService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      equipmentListing: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      equipmentListingImage: {
        count: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: GeoService, useValue: {} },
      ],
    }).compile();

    service = module.get<EquipmentListingsService>(EquipmentListingsService);
    prisma = module.get(PrismaService);
  });

  describe('addImages', () => {
    it('should throw InternalServerErrorException if transaction fails', async () => {
      const listingId = 'listing-123';
      const userId = 'user-123';
      
      prisma.equipmentListing.findUnique.mockResolvedValue({ id: listingId, userId });
      prisma.equipmentListingImage.count.mockResolvedValue(0);
      prisma.equipmentListingImage.aggregate.mockResolvedValue({ _max: { order: null } });
      
      prisma.$transaction.mockRejectedValue(new Error('DB Error'));

      await expect(service.addImages(listingId, userId, ['url1', 'url2'])).rejects.toThrow(InternalServerErrorException);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should successfully add images via transaction', async () => {
      const listingId = 'listing-123';
      const userId = 'user-123';
      
      prisma.equipmentListing.findUnique.mockResolvedValue({ id: listingId, userId });
      prisma.equipmentListingImage.count.mockResolvedValue(0);
      prisma.equipmentListingImage.aggregate.mockResolvedValue({ _max: { order: null } });
      
      const expectedImages = [{ id: 'img1', url: 'url1', isPrimary: true }];
      prisma.$transaction.mockResolvedValue(expectedImages);

      const result = await service.addImages(listingId, userId, ['url1']);
      
      expect(result).toEqual(expectedImages);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('should assign next image as primary if deleted image was primary', async () => {
      const imageId = 'img-1';
      const userId = 'user-123';
      const listingId = 'listing-123';
      const nextImageId = 'img-2';

      prisma.equipmentListingImage.findUnique.mockResolvedValue({
        id: imageId,
        isPrimary: true,
        equipmentListingId: listingId,
        equipmentListing: { userId },
      });

      prisma.equipmentListingImage.delete.mockResolvedValue({ id: imageId });
      
      prisma.equipmentListingImage.findFirst.mockResolvedValue({
        id: nextImageId,
      });

      prisma.equipmentListingImage.update.mockResolvedValue({ id: nextImageId, isPrimary: true });

      const result = await service.removeImage(imageId, userId);

      expect(result).toEqual({ deleted: true });
      expect(prisma.equipmentListingImage.delete).toHaveBeenCalledWith({ where: { id: imageId } });
      expect(prisma.equipmentListingImage.findFirst).toHaveBeenCalledWith({
        where: { equipmentListingId: listingId },
        orderBy: { order: 'asc' },
      });
      expect(prisma.equipmentListingImage.update).toHaveBeenCalledWith({
        where: { id: nextImageId },
        data: { isPrimary: true },
      });
    });

    it('should NOT reassign primary if deleted image was NOT primary', async () => {
      const imageId = 'img-1';
      const userId = 'user-123';
      const listingId = 'listing-123';

      prisma.equipmentListingImage.findUnique.mockResolvedValue({
        id: imageId,
        isPrimary: false,
        equipmentListingId: listingId,
        equipmentListing: { userId },
      });

      prisma.equipmentListingImage.delete.mockResolvedValue({ id: imageId });

      await service.removeImage(imageId, userId);

      expect(prisma.equipmentListingImage.delete).toHaveBeenCalledWith({ where: { id: imageId } });
      expect(prisma.equipmentListingImage.findFirst).not.toHaveBeenCalled();
      expect(prisma.equipmentListingImage.update).not.toHaveBeenCalled();
    });
  });

  describe('my — pagination', () => {
    it('should return paginated results with meta', async () => {
      const mockItems = [{ id: 'eq-1', title: 'Excavator 1' }, { id: 'eq-2', title: 'Excavator 2' }];
      prisma.equipmentListing.findMany.mockResolvedValue(mockItems);
      prisma.equipmentListing.count.mockResolvedValue(2);

      const result = await service.my('user-1', 1, 20);

      expect(result).toEqual({
        items: mockItems,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
      expect(prisma.equipmentListing.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          governorateRef: true,
          wilayaRef: true,
        },
      });
    });

    it('should cap limit at 50', async () => {
      prisma.equipmentListing.findMany.mockResolvedValue([]);
      prisma.equipmentListing.count.mockResolvedValue(0);

      const result = await service.my('user-1', 1, 100);

      expect(result.meta.limit).toBe(50);
      expect(prisma.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('should use default page=1, limit=20', async () => {
      prisma.equipmentListing.findMany.mockResolvedValue([]);
      prisma.equipmentListing.count.mockResolvedValue(0);

      const result = await service.my('user-1');

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(prisma.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip for page 3', async () => {
      prisma.equipmentListing.findMany.mockResolvedValue([]);
      prisma.equipmentListing.count.mockResolvedValue(45);

      const result = await service.my('user-1', 3, 10);

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(prisma.equipmentListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });
});
