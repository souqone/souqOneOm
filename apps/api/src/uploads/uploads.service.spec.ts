import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadFileStorageService } from './upload-file-storage.service';
import { UploadImageManagerService } from './upload-image-manager.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const mockPrisma = {
  listing: { findUnique: jest.fn() },
  listingImage: {
    aggregate: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockCloudinary = {
  upload: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image.jpg', public_id: 'carone/listings/abc' }),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Ensure local storage fallback
    delete process.env.CLOUDINARY_CLOUD_NAME;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        UploadFileStorageService,
        UploadImageManagerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  describe('uploadFile', () => {
    it('should reject files with unsupported mime type', async () => {
      const file = { mimetype: 'application/pdf', size: 1000, buffer: Buffer.alloc(0), originalname: 'test.pdf' } as Express.Multer.File;

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
    });

    it('should reject files exceeding size limit', async () => {
      const file = { mimetype: 'image/jpeg', size: 11 * 1024 * 1024, buffer: Buffer.alloc(0), originalname: 'big.jpg' } as Express.Multer.File;

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
    });

    it('should reject when no file provided', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addImageToListing', () => {
    it('should add image to listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'user-1' });
      mockPrisma.listingImage.aggregate.mockResolvedValue({ _max: { order: 0 } });
      mockPrisma.listingImage.count.mockResolvedValue(1);
      mockPrisma.listingImage.create.mockResolvedValue({ id: 'img-1', url: 'http://test.com/img.jpg' });

      const result = await service.addImageToListing('listing-1', 'user-1', 'http://test.com/img.jpg', false);
      expect(result.id).toBe('img-1');
    });

    it('should throw if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        service.addImageToListing('nonexistent', 'user-1', 'http://test.com/img.jpg', false),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not the seller', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'other-user' });

      await expect(
        service.addImageToListing('listing-1', 'user-1', 'http://test.com/img.jpg', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeImageFromListing', () => {
    it('should remove image and reassign primary', async () => {
      mockPrisma.listingImage.findUnique.mockResolvedValue({
        id: 'img-1',
        url: 'http://localhost:4000/uploads/test.jpg',
        isPrimary: true,
        listing: { sellerId: 'user-1', id: 'listing-1' },
      });
      mockPrisma.listingImage.delete.mockResolvedValue({});
      mockPrisma.listingImage.findFirst.mockResolvedValue({ id: 'img-2' });
      mockPrisma.listingImage.update.mockResolvedValue({});

      const result = await service.removeImageFromListing('img-1', 'user-1');
      expect(result.message).toContain('حذف');
    });

    it('should throw if image not found', async () => {
      mockPrisma.listingImage.findUnique.mockResolvedValue(null);

      await expect(service.removeImageFromListing('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
