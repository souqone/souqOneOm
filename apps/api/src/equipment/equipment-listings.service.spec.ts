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
});
