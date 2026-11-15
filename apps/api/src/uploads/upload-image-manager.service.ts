import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadFileStorageService } from './upload-file-storage.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UploadImageManagerService {
  private readonly logger = new Logger(UploadImageManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: UploadFileStorageService,
    private readonly redis: RedisService,
  ) {}

  private async deleteStoredImageByUrl(url: string) {
    if (url.includes('cloudinary')) {
      const match = url.match(/upload\/(?:v\d+\/)?(carone\/.+)\.[a-z]+$/i);
      if (match) await this.storage.deleteFile(match[1]);
    } else {
      const urlParts = url.split('/uploads/');
      if (urlParts.length > 1) await this.storage.deleteFile(urlParts[1]);
    }
  }

  private async invalidateListingCaches(listingId: string): Promise<void> {
    try {
      await this.redis.del(`listing:${listingId}`);
      await this.redis.delPattern('listings:*');
    } catch (err) {
      this.logger.warn(`Failed to invalidate listing caches for ${listingId}`);
    }
  }

  private async invalidateCarServiceCaches(serviceId: string): Promise<void> {
    try {
      await this.redis.del(`carService:detail:${serviceId}`);
      await this.redis.delPattern('carService:list:*');
    } catch (err) {
      this.logger.warn(`Failed to invalidate carService caches for ${serviceId}`);
    }
  }

  private async invalidateBusCaches(busId: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.delPattern('busListing:list:*');
      await this.redis.delPattern('busListing:similar:*');
      await this.redis.del(`busListing:detail:${busId}`);
      await this.redis.delPattern('busListing:slug:*');
    } catch (err) {
      this.logger.warn(`Failed to invalidate busListing caches for ${busId}`);
    }
  }

  async addImageToListing(listingId: string, userId: string, url: string, isPrimary: boolean) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Acquire row lock on the listing to serialize concurrent uploads
      await tx.$executeRaw`SELECT id FROM "listings" WHERE id = ${listingId} FOR UPDATE`;

      const maxOrder = await tx.listingImage.aggregate({
        where: { listingId },
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? -1) + 1;

      const imageCount = await tx.listingImage.count({ where: { listingId } });
      if (imageCount >= 20) {
        throw new BadRequestException('لا يمكن إضافة أكثر من 20 صورة');
      }

      const shouldBePrimary = isPrimary || imageCount === 0;

      if (shouldBePrimary && imageCount > 0) {
        await tx.listingImage.updateMany({
          where: { listingId },
          data: { isPrimary: false },
        });
      }

      return tx.listingImage.create({
        data: { url, order: nextOrder, isPrimary: shouldBePrimary, listingId },
      });
    });

    await this.invalidateListingCaches(listingId);

    return result;
  }

  async removeImageFromListing(imageId: string, userId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { sellerId: true, id: true } } },
    });
    if (!image) throw new NotFoundException('الصورة غير موجودة');
    if (image.listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const listingId = image.listing.id;

    await this.deleteStoredImageByUrl(image.url);
    await this.prisma.listingImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const first = await this.prisma.listingImage.findFirst({
        where: { listingId: image.listing.id },
        orderBy: { order: 'asc' },
      });
      if (first) {
        await this.prisma.listingImage.update({ where: { id: first.id }, data: { isPrimary: true } });
      }
    }

    await this.invalidateListingCaches(listingId);

    return { message: 'تم حذف الصورة بنجاح' };
  }

  private async reorderSectionImages(params: {
    entityId: string;
    userId: string;
    imageIds: string[];
    notFoundMessage: string;
    findParent: () => Promise<{ ownerId: string } | null>;
    findImages: (ids: string[]) => Promise<Array<{ id: string; parentId: string }>>;
    resetOtherPrimary: () => Promise<unknown>;
    updateImageOrder: (id: string, order: number, isPrimary: boolean) => Promise<unknown>;
    onMutated?: () => Promise<void>;
  }) {
    if (!Array.isArray(params.imageIds) || params.imageIds.length === 0) {
      throw new BadRequestException('قائمة الصور غير صالحة');
    }
    if (new Set(params.imageIds).size !== params.imageIds.length) {
      throw new BadRequestException('قائمة الصور تحتوي على معرّفات مكررة');
    }

    const parent = await params.findParent();
    if (!parent) throw new NotFoundException(params.notFoundMessage);
    if (parent.ownerId !== params.userId) {
      throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');
    }

    const images = await params.findImages(params.imageIds);
    if (images.length !== params.imageIds.length) {
      throw new BadRequestException('بعض الصور غير موجودة');
    }

    const invalidImage = images.find((img) => img.parentId !== params.entityId);
    if (invalidImage) {
      throw new ForbiddenException('لا يمكنك ترتيب صور لا تنتمي لهذا الإعلان');
    }

    await this.prisma.$transaction([
      params.resetOtherPrimary() as any,
      ...params.imageIds.map((id, index) =>
        params.updateImageOrder(id, index, index === 0) as any,
      ),
    ]);

    if (params.onMutated) await params.onMutated();

    return { message: 'تم إعادة ترتيب الصور بنجاح' };
  }

  async reorderImages(listingId: string, userId: string, imageIds: string[]) {
    return this.reorderSectionImages({
      entityId: listingId,
      userId,
      imageIds,
      notFoundMessage: 'الإعلان غير موجود',
      findParent: async () => {
        const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
        return listing ? { ownerId: listing.sellerId } : null;
      },
      findImages: async (ids) => {
        const rows = await this.prisma.listingImage.findMany({
          where: { id: { in: ids } },
          select: { id: true, listingId: true },
        });
        return rows.map((r) => ({ id: r.id, parentId: r.listingId }));
      },
      resetOtherPrimary: () =>
        this.prisma.listingImage.updateMany({
          where: { listingId, id: { notIn: imageIds } },
          data: { isPrimary: false },
        }),
      updateImageOrder: (id, order, isPrimary) =>
        this.prisma.listingImage.update({ where: { id }, data: { order, isPrimary } }),
      onMutated: () => this.invalidateListingCaches(listingId),
    });
  }

  async reorderPartImages(partId: string, userId: string, imageIds: string[]) {
    return this.reorderSectionImages({
      entityId: partId,
      userId,
      imageIds,
      notFoundMessage: 'قطعة الغيار غير موجودة',
      findParent: async () => {
        const part = await this.prisma.sparePart.findFirst({ where: { id: partId, deletedAt: null } });
        return part ? { ownerId: part.sellerId } : null;
      },
      findImages: async (ids) => {
        const rows = await this.prisma.sparePartImage.findMany({
          where: { id: { in: ids } },
          select: { id: true, sparePartId: true },
        });
        return rows.map((r) => ({ id: r.id, parentId: r.sparePartId }));
      },
      resetOtherPrimary: () =>
        this.prisma.sparePartImage.updateMany({
          where: { sparePartId: partId, id: { notIn: imageIds } },
          data: { isPrimary: false },
        }),
      updateImageOrder: (id, order, isPrimary) =>
        this.prisma.sparePartImage.update({ where: { id }, data: { order, isPrimary } }),
    });
  }

  async reorderServiceImages(serviceId: string, userId: string, imageIds: string[]) {
    return this.reorderSectionImages({
      entityId: serviceId,
      userId,
      imageIds,
      notFoundMessage: 'الخدمة غير موجودة',
      findParent: async () => {
        const svc = await this.prisma.carService.findFirst({ where: { id: serviceId, deletedAt: null } });
        return svc ? { ownerId: svc.userId } : null;
      },
      findImages: async (ids) => {
        const rows = await this.prisma.carServiceImage.findMany({
          where: { id: { in: ids } },
          select: { id: true, carServiceId: true },
        });
        return rows.map((r) => ({ id: r.id, parentId: r.carServiceId }));
      },
      resetOtherPrimary: () =>
        this.prisma.carServiceImage.updateMany({
          where: { carServiceId: serviceId, id: { notIn: imageIds } },
          data: { isPrimary: false },
        }),
      updateImageOrder: (id, order, isPrimary) =>
        this.prisma.carServiceImage.update({ where: { id }, data: { order, isPrimary } }),
      onMutated: () => this.invalidateCarServiceCaches(serviceId),
    });
  }

  async reorderBusImages(busId: string, userId: string, imageIds: string[]) {
    return this.reorderSectionImages({
      entityId: busId,
      userId,
      imageIds,
      notFoundMessage: 'إعلان الحافلة غير موجود',
      findParent: async () => {
        const bus = await this.prisma.busListing.findFirst({ where: { id: busId, deletedAt: null } });
        return bus ? { ownerId: bus.userId } : null;
      },
      findImages: async (ids) => {
        const rows = await this.prisma.busListingImage.findMany({
          where: { id: { in: ids } },
          select: { id: true, busListingId: true },
        });
        return rows.map((r) => ({ id: r.id, parentId: r.busListingId }));
      },
      resetOtherPrimary: () =>
        this.prisma.busListingImage.updateMany({
          where: { busListingId: busId, id: { notIn: imageIds } },
          data: { isPrimary: false },
        }),
      updateImageOrder: (id, order, isPrimary) =>
        this.prisma.busListingImage.update({ where: { id }, data: { order, isPrimary } }),
      onMutated: () => this.invalidateBusCaches(busId),
    });
  }

  async reorderEquipmentImages(equipmentId: string, userId: string, imageIds: string[]) {
    return this.reorderSectionImages({
      entityId: equipmentId,
      userId,
      imageIds,
      notFoundMessage: 'إعلان المعدة غير موجود',
      findParent: async () => {
        const eq = await this.prisma.equipmentListing.findFirst({ where: { id: equipmentId, deletedAt: null } });
        return eq ? { ownerId: eq.userId } : null;
      },
      findImages: async (ids) => {
        const rows = await this.prisma.equipmentListingImage.findMany({
          where: { id: { in: ids } },
          select: { id: true, equipmentListingId: true },
        });
        return rows.map((r) => ({ id: r.id, parentId: r.equipmentListingId }));
      },
      resetOtherPrimary: () =>
        this.prisma.equipmentListingImage.updateMany({
          where: { equipmentListingId: equipmentId, id: { notIn: imageIds } },
          data: { isPrimary: false },
        }),
      updateImageOrder: (id, order, isPrimary) =>
        this.prisma.equipmentListingImage.update({ where: { id }, data: { order, isPrimary } }),
    });
  }

  async getListingImages(listingId: string) {
    return this.prisma.listingImage.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });
  }

  async addImageToPart(partId: string, userId: string, url: string, isPrimary: boolean) {
    const part = await this.prisma.sparePart.findFirst({ where: { id: partId, deletedAt: null } });
    if (!part) throw new NotFoundException('قطعة الغيار غير موجودة');
    if (part.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const maxOrder = await this.prisma.sparePartImage.aggregate({ where: { sparePartId: partId }, _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.sparePartImage.updateMany({ where: { sparePartId: partId }, data: { isPrimary: false } });
    }
    const imageCount = await this.prisma.sparePartImage.count({ where: { sparePartId: partId } });
    const shouldBePrimary = isPrimary || imageCount === 0;

    return this.prisma.sparePartImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, sparePartId: partId },
    });
  }

  async removeImageFromPart(imageId: string, userId: string) {
    const image = await this.prisma.sparePartImage.findUnique({
      where: { id: imageId },
      include: { sparePart: { select: { sellerId: true, id: true, deletedAt: true } } },
    });
    if (!image || image.sparePart.deletedAt != null) throw new NotFoundException('الصورة غير موجودة');
    if (image.sparePart.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    await this.deleteStoredImageByUrl(image.url);
    await this.prisma.sparePartImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const first = await this.prisma.sparePartImage.findFirst({
        where: { sparePartId: image.sparePart.id },
        orderBy: { order: 'asc' },
      });
      if (first) {
        await this.prisma.sparePartImage.update({ where: { id: first.id }, data: { isPrimary: true } });
      }
    }

    return { message: 'تم حذف الصورة بنجاح' };
  }

  async addImageToService(serviceId: string, userId: string, url: string, isPrimary: boolean) {
    const service = await this.prisma.carService.findFirst({ where: { id: serviceId, deletedAt: null } });
    if (!service) throw new NotFoundException('الخدمة غير موجودة');
    if (service.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const imageCount = await this.prisma.carServiceImage.count({ where: { carServiceId: serviceId } });
    if (imageCount >= 10) {
      throw new BadRequestException('لا يمكن إضافة أكثر من 10 صور');
    }

    const maxOrder = await this.prisma.carServiceImage.aggregate({ where: { carServiceId: serviceId }, _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.carServiceImage.updateMany({ where: { carServiceId: serviceId }, data: { isPrimary: false } });
    }
    const shouldBePrimary = isPrimary || imageCount === 0;

    const created = await this.prisma.carServiceImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, carServiceId: serviceId },
    });

    await this.invalidateCarServiceCaches(serviceId);

    return created;
  }

  async removeImageFromService(imageId: string, userId: string) {
    const image = await this.prisma.carServiceImage.findUnique({
      where: { id: imageId },
      include: { carService: { select: { userId: true, id: true, deletedAt: true } } },
    });
    if (!image || image.carService.deletedAt != null) throw new NotFoundException('الصورة غير موجودة');
    if (image.carService.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    await this.deleteStoredImageByUrl(image.url);
    await this.prisma.carServiceImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const first = await this.prisma.carServiceImage.findFirst({
        where: { carServiceId: image.carService.id },
        orderBy: { order: 'asc' },
      });
      if (first) {
        await this.prisma.carServiceImage.update({ where: { id: first.id }, data: { isPrimary: true } });
      }
    }

    await this.invalidateCarServiceCaches(image.carService.id);

    return { message: 'تم حذف الصورة بنجاح' };
  }

  private async addImageToUserOwnedListing<T>(params: {
    userId: string;
    isPrimary: boolean;
    notFoundMessage: string;
    findParent: () => Promise<{ userId: string } | null>;
    countImages: () => Promise<number>;
    getMaxOrder: () => Promise<number | null>;
    clearPrimary: () => Promise<unknown>;
    createImage: (order: number, shouldBePrimary: boolean) => Promise<T>;
    onMutated?: () => Promise<void>;
  }): Promise<T> {
    const parent = await params.findParent();
    if (!parent) throw new NotFoundException(params.notFoundMessage);
    if (parent.userId !== params.userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const imageCount = await params.countImages();
    if (imageCount >= 10) throw new BadRequestException('الحد الأقصى 10 صور لكل إعلان');

    const maxOrder = await params.getMaxOrder();
    const nextOrder = (maxOrder ?? -1) + 1;

    if (params.isPrimary) {
      await params.clearPrimary();
    }
    const shouldBePrimary = params.isPrimary || imageCount === 0;

    const created = await params.createImage(nextOrder, shouldBePrimary);
    if (params.onMutated) await params.onMutated();
    return created;
  }

  private async removeImageFromUserOwnedListing(params: {
    userId: string;
    findImage: () => Promise<{
      url: string;
      isPrimary: boolean;
      parent: { id: string; userId: string; deletedAt: Date | null };
    } | null>;
    deleteImage: () => Promise<unknown>;
    findFirstRemaining: (parentId: string) => Promise<{ id: string } | null>;
    promotePrimary: (nextImageId: string) => Promise<unknown>;
    onMutated?: (parentId: string) => Promise<void>;
  }) {
    const image = await params.findImage();
    if (!image || image.parent.deletedAt != null) {
      throw new NotFoundException('الصورة غير موجودة');
    }
    if (image.parent.userId !== params.userId) {
      throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');
    }

    await this.deleteStoredImageByUrl(image.url);
    await params.deleteImage();

    if (image.isPrimary) {
      const first = await params.findFirstRemaining(image.parent.id);
      if (first) {
        await params.promotePrimary(first.id);
      }
    }

    if (params.onMutated) await params.onMutated(image.parent.id);
    return { message: 'تم حذف الصورة بنجاح' };
  }

  async addImageToBus(busId: string, userId: string, url: string, isPrimary: boolean) {
    return this.addImageToUserOwnedListing({
      userId,
      isPrimary,
      notFoundMessage: 'إعلان الحافلة غير موجود',
      findParent: () => this.prisma.busListing.findFirst({ where: { id: busId, deletedAt: null } }),
      countImages: () => this.prisma.busListingImage.count({ where: { busListingId: busId } }),
      getMaxOrder: async () => {
        const res = await this.prisma.busListingImage.aggregate({
          where: { busListingId: busId },
          _max: { order: true },
        });
        return res._max.order;
      },
      clearPrimary: () =>
        this.prisma.busListingImage.updateMany({ where: { busListingId: busId }, data: { isPrimary: false } }),
      createImage: (order, shouldBePrimary) =>
        this.prisma.busListingImage.create({
          data: { url, order, isPrimary: shouldBePrimary, busListingId: busId },
        }),
      onMutated: () => this.invalidateBusCaches(busId),
    });
  }

  async removeImageFromBus(imageId: string, userId: string) {
    return this.removeImageFromUserOwnedListing({
      userId,
      findImage: async () => {
        const image = await this.prisma.busListingImage.findUnique({
          where: { id: imageId },
          include: { busListing: { select: { userId: true, id: true, deletedAt: true } } },
        });
        return image ? { url: image.url, isPrimary: image.isPrimary, parent: image.busListing } : null;
      },
      deleteImage: () => this.prisma.busListingImage.delete({ where: { id: imageId } }),
      findFirstRemaining: (busListingId) =>
        this.prisma.busListingImage.findFirst({ where: { busListingId }, orderBy: { order: 'asc' } }),
      promotePrimary: (id) =>
        this.prisma.busListingImage.update({ where: { id }, data: { isPrimary: true } }),
      onMutated: (busListingId) => this.invalidateBusCaches(busListingId),
    });
  }

  async addImageToEquipment(equipmentId: string, userId: string, url: string, isPrimary: boolean) {
    return this.addImageToUserOwnedListing({
      userId,
      isPrimary,
      notFoundMessage: 'إعلان المعدة غير موجود',
      findParent: () =>
        this.prisma.equipmentListing.findFirst({ where: { id: equipmentId, deletedAt: null } }),
      countImages: () =>
        this.prisma.equipmentListingImage.count({ where: { equipmentListingId: equipmentId } }),
      getMaxOrder: async () => {
        const res = await this.prisma.equipmentListingImage.aggregate({
          where: { equipmentListingId: equipmentId },
          _max: { order: true },
        });
        return res._max.order;
      },
      clearPrimary: () =>
        this.prisma.equipmentListingImage.updateMany({
          where: { equipmentListingId: equipmentId },
          data: { isPrimary: false },
        }),
      createImage: (order, shouldBePrimary) =>
        this.prisma.equipmentListingImage.create({
          data: { url, order, isPrimary: shouldBePrimary, equipmentListingId: equipmentId },
        }),
    });
  }

  async removeImageFromEquipment(imageId: string, userId: string) {
    return this.removeImageFromUserOwnedListing({
      userId,
      findImage: async () => {
        const image = await this.prisma.equipmentListingImage.findUnique({
          where: { id: imageId },
          include: { equipmentListing: { select: { userId: true, id: true, deletedAt: true } } },
        });
        return image ? { url: image.url, isPrimary: image.isPrimary, parent: image.equipmentListing } : null;
      },
      deleteImage: () => this.prisma.equipmentListingImage.delete({ where: { id: imageId } }),
      findFirstRemaining: (equipmentListingId) =>
        this.prisma.equipmentListingImage.findFirst({
          where: { equipmentListingId },
          orderBy: { order: 'asc' },
        }),
      promotePrimary: (id) =>
        this.prisma.equipmentListingImage.update({ where: { id }, data: { isPrimary: true } }),
    });
  }

}
