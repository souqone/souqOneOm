import { Injectable } from '@nestjs/common';
import { UploadFileStorageService } from './upload-file-storage.service';
import { UploadImageManagerService } from './upload-image-manager.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly storage: UploadFileStorageService,
    private readonly images: UploadImageManagerService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    return this.storage.uploadFile(file);
  }

  async deleteFile(key: string): Promise<void> {
    return this.storage.deleteFile(key);
  }

  // ─── Listing Images ───

  async addImageToListing(
    listingId: string,
    userId: string,
    url: string,
    isPrimary: boolean,
  ) {
    return this.images.addImageToListing(listingId, userId, url, isPrimary);
  }

  async removeImageFromListing(imageId: string, userId: string) {
    return this.images.removeImageFromListing(imageId, userId);
  }

  async reorderImages(listingId: string, userId: string, imageIds: string[]) {
    return this.images.reorderImages(listingId, userId, imageIds);
  }

  async getListingImages(listingId: string) {
    return this.images.getListingImages(listingId);
  }

  // ─── Spare Part Images ───

  async addImageToPart(partId: string, userId: string, url: string, isPrimary: boolean) {
    return this.images.addImageToPart(partId, userId, url, isPrimary);
  }

  async removeImageFromPart(imageId: string, userId: string) {
    return this.images.removeImageFromPart(imageId, userId);
  }

  // ─── Car Service Images ───

  async addImageToService(serviceId: string, userId: string, url: string, isPrimary: boolean) {
    return this.images.addImageToService(serviceId, userId, url, isPrimary);
  }

  async removeImageFromService(imageId: string, userId: string) {
    return this.images.removeImageFromService(imageId, userId);
  }

  // ─── Bus Listing Images ───

  async addImageToBus(busId: string, userId: string, url: string, isPrimary: boolean) {
    return this.images.addImageToBus(busId, userId, url, isPrimary);
  }

  // ─── Transport Images ───

  async addImageToTransport(transportId: string, userId: string, url: string, isPrimary: boolean) {
    return this.images.addImageToTransport(transportId, userId, url, isPrimary);
  }

  // ─── Equipment Images ───

  async addImageToEquipment(equipmentId: string, userId: string, url: string, isPrimary: boolean) {
    return this.images.addImageToEquipment(equipmentId, userId, url, isPrimary);
  }

}
