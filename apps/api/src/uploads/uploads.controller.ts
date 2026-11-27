import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Get,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { UploadsService } from './uploads.service';
import { validateTrustedImageUrl } from '../common/utils/image-url.validator';
import {
  CHAT_UPLOAD_MAX_BODY_BYTES,
  CHAT_UPLOAD_THROTTLE_LIMIT,
  CHAT_UPLOAD_THROTTLE_TTL_MS,
} from './chat-media.constants';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /** Upload a single image file */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }

  /** Upload a single chat media file (images, PDF, audio) */
  @Throttle({
    default: { limit: CHAT_UPLOAD_THROTTLE_LIMIT, ttl: CHAT_UPLOAD_THROTTLE_TTL_MS },
  })
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: CHAT_UPLOAD_MAX_BODY_BYTES } }),
  )
  async uploadChatMedia(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadChatMedia(file);
  }

  /** Upload multiple image files (max 10) */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map((file) => this.uploadsService.uploadFile(file)),
    );
    return results;
  }

  // ─── Listing Image Management ───

  /** Get images for a listing */
  @Get('listings/:listingId/images')
  async getImages(@Param('listingId') listingId: string) {
    return this.uploadsService.getListingImages(listingId);
  }

  /** Upload & attach image to a listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('listings/:listingId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addImage(
    @Param('listingId') listingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToListing(
      listingId,
      user.sub,
      url,
      isPrimary === 'true',
    );
  }

  /** Attach an already-uploaded image URL to a listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('listings/:listingId/images/url')
  async addImageByUrl(
    @Param('listingId') listingId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    validateTrustedImageUrl(body?.url);
    return this.uploadsService.addImageToListing(
      listingId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  /** Remove an image from a listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete('listings/:listingId/images/:imageId')
  async removeImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromListing(imageId, user.sub);
  }

  /** Reorder images for a listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('listings/:listingId/images/reorder')
  async reorderImages(
    @Param('listingId') listingId: string,
    @Body() body: { imageIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.reorderImages(listingId, user.sub, body.imageIds);
  }

  // ─── Spare Part Image Management ───

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('parts/:partId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addPartImage(
    @Param('partId') partId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToPart(partId, user.sub, url, isPrimary === 'true');
  }

  /** Attach an already-uploaded image URL to a spare part */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('parts/:partId/images/url')
  async addPartImageByUrl(
    @Param('partId') partId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    validateTrustedImageUrl(body?.url);
    return this.uploadsService.addImageToPart(
      partId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete('parts/images/:imageId')
  async removePartImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromPart(imageId, user.sub);
  }

  /** Reorder images for a spare part */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('parts/:partId/images/reorder')
  async reorderPartImages(
    @Param('partId') partId: string,
    @Body() body: { imageIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.reorderPartImages(partId, user.sub, body?.imageIds);
  }

  // ─── Car Service Image Management ───

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('services/:serviceId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addServiceImage(
    @Param('serviceId') serviceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToService(serviceId, user.sub, url, isPrimary === 'true');
  }

  /** Attach an already-uploaded image URL to a car service */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('services/:serviceId/images/url')
  async addServiceImageByUrl(
    @Param('serviceId') serviceId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    validateTrustedImageUrl(body?.url);
    return this.uploadsService.addImageToService(
      serviceId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete('services/images/:imageId')
  async removeServiceImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromService(imageId, user.sub);
  }

  /** Reorder images for a car service */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('services/:serviceId/images/reorder')
  async reorderServiceImages(
    @Param('serviceId') serviceId: string,
    @Body() body: { imageIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.reorderServiceImages(serviceId, user.sub, body?.imageIds);
  }

  // ─── Bus Listing Image Management ───

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('buses/:busId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addBusImage(
    @Param('busId') busId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToBus(busId, user.sub, url, isPrimary === 'true');
  }

  /** Attach an already-uploaded image URL to a bus listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('buses/:busId/images/url')
  async addBusImageByUrl(
    @Param('busId') busId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    validateTrustedImageUrl(body?.url);
    return this.uploadsService.addImageToBus(
      busId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete('buses/images/:imageId')
  async removeBusImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromBus(imageId, user.sub);
  }

  /** Reorder images for a bus listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('buses/:busId/images/reorder')
  async reorderBusImages(
    @Param('busId') busId: string,
    @Body() body: { imageIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.reorderBusImages(busId, user.sub, body?.imageIds);
  }

  // ─── Equipment Image Management ───

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('equipment/:equipmentId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addEquipmentImage(
    @Param('equipmentId') equipmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToEquipment(equipmentId, user.sub, url, isPrimary === 'true');
  }

  /** Attach an already-uploaded image URL to an equipment listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('equipment/:equipmentId/images/url')
  async addEquipmentImageByUrl(
    @Param('equipmentId') equipmentId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    validateTrustedImageUrl(body?.url);
    return this.uploadsService.addImageToEquipment(
      equipmentId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Delete('equipment/images/:imageId')
  async removeEquipmentImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromEquipment(imageId, user.sub);
  }

  /** Reorder images for an equipment listing */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('equipment/:equipmentId/images/reorder')
  async reorderEquipmentImages(
    @Param('equipmentId') equipmentId: string,
    @Body() body: { imageIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.reorderEquipmentImages(equipmentId, user.sub, body?.imageIds);
  }
}
