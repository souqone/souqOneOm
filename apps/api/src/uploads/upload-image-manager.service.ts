import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadFileStorageService } from './upload-file-storage.service';

@Injectable()
export class UploadImageManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: UploadFileStorageService,
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

  async addImageToListing(listingId: string, userId: string, url: string, isPrimary: boolean) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const maxOrder = await this.prisma.listingImage.aggregate({
      where: { listingId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.listingImage.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      });
    }

    const imageCount = await this.prisma.listingImage.count({ where: { listingId } });
    const shouldBePrimary = isPrimary || imageCount === 0;

    return this.prisma.listingImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, listingId },
    });
  }

  async removeImageFromListing(imageId: string, userId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { sellerId: true, id: true } } },
    });
    if (!image) throw new NotFoundException('الصورة غير موجودة');
    if (image.listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

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

    return { message: 'تم حذف الصورة بنجاح' };
  }

  async reorderImages(listingId: string, userId: string, imageIds: string[]) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.listingImage.update({
          where: { id },
          data: { order: index, isPrimary: index === 0 },
        }),
      ),
    );

    return { message: 'تم إعادة ترتيب الصور بنجاح' };
  }

  async getListingImages(listingId: string) {
    return this.prisma.listingImage.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });
  }

  async addImageToPart(partId: string, userId: string, url: string, isPrimary: boolean) {
    const part = await this.prisma.sparePart.findUnique({ where: { id: partId } });
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
      include: { sparePart: { select: { sellerId: true, id: true } } },
    });
    if (!image) throw new NotFoundException('الصورة غير موجودة');
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
    const service = await this.prisma.carService.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('الخدمة غير موجودة');
    if (service.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const maxOrder = await this.prisma.carServiceImage.aggregate({ where: { carServiceId: serviceId }, _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.carServiceImage.updateMany({ where: { carServiceId: serviceId }, data: { isPrimary: false } });
    }
    const imageCount = await this.prisma.carServiceImage.count({ where: { carServiceId: serviceId } });
    const shouldBePrimary = isPrimary || imageCount === 0;

    return this.prisma.carServiceImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, carServiceId: serviceId },
    });
  }

  async removeImageFromService(imageId: string, userId: string) {
    const image = await this.prisma.carServiceImage.findUnique({
      where: { id: imageId },
      include: { carService: { select: { userId: true, id: true } } },
    });
    if (!image) throw new NotFoundException('الصورة غير موجودة');
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

    return { message: 'تم حذف الصورة بنجاح' };
  }

  async addImageToBus(busId: string, userId: string, url: string, isPrimary: boolean) {
    const bus = await this.prisma.busListing.findUnique({ where: { id: busId } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const maxOrder = await this.prisma.busListingImage.aggregate({ where: { busListingId: busId }, _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.busListingImage.updateMany({ where: { busListingId: busId }, data: { isPrimary: false } });
    }
    const imageCount = await this.prisma.busListingImage.count({ where: { busListingId: busId } });
    const shouldBePrimary = isPrimary || imageCount === 0;

    return this.prisma.busListingImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, busListingId: busId },
    });
  }

  async addImageToEquipment(equipmentId: string, userId: string, url: string, isPrimary: boolean) {
    const equipment = await this.prisma.equipmentListing.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw new NotFoundException('إعلان المعدة غير موجود');
    if (equipment.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const imageCount = await this.prisma.equipmentListingImage.count({ where: { equipmentListingId: equipmentId } });
    if (imageCount >= 10) throw new BadRequestException('الحد الأقصى 10 صور لكل إعلان');

    const maxOrder = await this.prisma.equipmentListingImage.aggregate({ where: { equipmentListingId: equipmentId }, _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    if (isPrimary) {
      await this.prisma.equipmentListingImage.updateMany({ where: { equipmentListingId: equipmentId }, data: { isPrimary: false } });
    }
    const shouldBePrimary = isPrimary || imageCount === 0;

    return this.prisma.equipmentListingImage.create({
      data: { url, order: nextOrder, isPrimary: shouldBePrimary, equipmentListingId: equipmentId },
    });
  }

}
