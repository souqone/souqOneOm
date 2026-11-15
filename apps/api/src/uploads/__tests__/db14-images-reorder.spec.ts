import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UploadsController } from '../uploads.controller';
import { UploadsService } from '../uploads.service';
import { UploadImageManagerService } from '../upload-image-manager.service';
import { UploadFileStorageService } from '../upload-file-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { RedisService } from '../../redis/redis.service';

describe('D-B14: Generalized Images Reorder Across All 5 Sections', () => {
  let controller: UploadsController;

  const mockUser = { sub: 'owner-1', email: 'owner@example.com', username: 'owner', role: 'USER' };

  const makeImageModel = () => ({
    findMany: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockImplementation(async ({ where, data }) => ({ id: where.id, ...data })),
  });

  const mockPrisma = {
    listing: { findUnique: jest.fn() },
    listingImage: makeImageModel(),
    sparePart: { findFirst: jest.fn() },
    sparePartImage: makeImageModel(),
    carService: { findFirst: jest.fn() },
    carServiceImage: makeImageModel(),
    busListing: { findFirst: jest.fn() },
    busListingImage: makeImageModel(),
    equipmentListing: { findFirst: jest.fn() },
    equipmentListingImage: makeImageModel(),
    $transaction: jest.fn().mockImplementation(async (ops: any[]) => Promise.all(ops)),
  };

  const mockStorage = { uploadFile: jest.fn(), deleteFile: jest.fn() };
  const mockCloudinary = { upload: jest.fn(), delete: jest.fn() };
  const mockRedis = {
    del: jest.fn().mockResolvedValue(1),
    delPattern: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
  });

  it('reorders listing images atomically and invalidates listing caches', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({ id: 'car-1', sellerId: 'owner-1' });
    mockPrisma.listingImage.findMany.mockResolvedValue([
      { id: 'img-2', listingId: 'car-1' },
      { id: 'img-1', listingId: 'car-1' },
    ]);

    const res = await controller.reorderImages('car-1', { imageIds: ['img-2', 'img-1'] }, mockUser as any);
    expect(res).toEqual({ message: 'تم إعادة ترتيب الصور بنجاح' });
    expect(mockPrisma.listingImage.update).toHaveBeenCalledWith({
      where: { id: 'img-2' },
      data: { order: 0, isPrimary: true },
    });
    expect(mockPrisma.listingImage.update).toHaveBeenCalledWith({
      where: { id: 'img-1' },
      data: { order: 1, isPrimary: false },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('listing:car-1');
  });

  it('reorders spare part images atomically and enforces ownership & validation', async () => {
    mockPrisma.sparePart.findFirst.mockResolvedValue({ id: 'part-1', sellerId: 'owner-1', deletedAt: null });
    mockPrisma.sparePartImage.findMany.mockResolvedValue([
      { id: 'p2', sparePartId: 'part-1' },
      { id: 'p1', sparePartId: 'part-1' },
    ]);

    const res = await (controller as any).reorderPartImages('part-1', { imageIds: ['p2', 'p1'] }, mockUser as any);
    expect(res).toEqual({ message: 'تم إعادة ترتيب الصور بنجاح' });
    expect(mockPrisma.sparePartImage.update).toHaveBeenCalledWith({
      where: { id: 'p2' },
      data: { order: 0, isPrimary: true },
    });

    await expect(
      (controller as any).reorderPartImages('part-1', { imageIds: ['p1', 'p1'] }, mockUser as any),
    ).rejects.toThrow(BadRequestException);

    mockPrisma.sparePart.findFirst.mockResolvedValueOnce(null);
    await expect(
      (controller as any).reorderPartImages('missing', { imageIds: ['p1'] }, mockUser as any),
    ).rejects.toThrow(NotFoundException);

    mockPrisma.sparePart.findFirst.mockResolvedValueOnce({ id: 'part-1', sellerId: 'other-user', deletedAt: null });
    await expect(
      (controller as any).reorderPartImages('part-1', { imageIds: ['p1'] }, mockUser as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('reorders service images atomically and invalidates carService caches', async () => {
    mockPrisma.carService.findFirst.mockResolvedValue({ id: 'svc-1', userId: 'owner-1', deletedAt: null });
    mockPrisma.carServiceImage.findMany.mockResolvedValue([
      { id: 's2', carServiceId: 'svc-1' },
      { id: 's1', carServiceId: 'svc-1' },
    ]);

    const res = await (controller as any).reorderServiceImages('svc-1', { imageIds: ['s2', 's1'] }, mockUser as any);
    expect(res).toEqual({ message: 'تم إعادة ترتيب الصور بنجاح' });
    expect(mockPrisma.carServiceImage.update).toHaveBeenCalledWith({
      where: { id: 's2' },
      data: { order: 0, isPrimary: true },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('carService:detail:svc-1');
    expect(mockRedis.delPattern).toHaveBeenCalledWith('carService:list:*');
  });

  it('reorders bus images atomically and invalidates busListing caches', async () => {
    mockPrisma.busListing.findFirst.mockResolvedValue({ id: 'bus-1', userId: 'owner-1', deletedAt: null });
    mockPrisma.busListingImage.findMany.mockResolvedValue([
      { id: 'b2', busListingId: 'bus-1' },
      { id: 'b1', busListingId: 'bus-1' },
    ]);

    const res = await (controller as any).reorderBusImages('bus-1', { imageIds: ['b2', 'b1'] }, mockUser as any);
    expect(res).toEqual({ message: 'تم إعادة ترتيب الصور بنجاح' });
    expect(mockPrisma.busListingImage.update).toHaveBeenCalledWith({
      where: { id: 'b2' },
      data: { order: 0, isPrimary: true },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('busListing:detail:bus-1');
    expect(mockRedis.delPattern).toHaveBeenCalledWith('busListing:list:*');
  });

  it('reorders equipment images atomically and rejects cross-listing image IDs', async () => {
    mockPrisma.equipmentListing.findFirst.mockResolvedValue({ id: 'eq-1', userId: 'owner-1', deletedAt: null });
    mockPrisma.equipmentListingImage.findMany.mockResolvedValue([
      { id: 'e2', equipmentListingId: 'eq-1' },
      { id: 'e1', equipmentListingId: 'eq-1' },
    ]);

    const res = await (controller as any).reorderEquipmentImages('eq-1', { imageIds: ['e2', 'e1'] }, mockUser as any);
    expect(res).toEqual({ message: 'تم إعادة ترتيب الصور بنجاح' });
    expect(mockPrisma.equipmentListingImage.update).toHaveBeenCalledWith({
      where: { id: 'e2' },
      data: { order: 0, isPrimary: true },
    });

    mockPrisma.equipmentListingImage.findMany.mockResolvedValueOnce([
      { id: 'e2', equipmentListingId: 'eq-other' },
    ]);
    await expect(
      (controller as any).reorderEquipmentImages('eq-1', { imageIds: ['e2'] }, mockUser as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
