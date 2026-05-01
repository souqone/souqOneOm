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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /** Upload a single image file */
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }

  /** Upload multiple image files (max 10) */
  @UseGuards(JwtAuthGuard)
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
  @Post('listings/:listingId/images/url')
  async addImageByUrl(
    @Param('listingId') listingId: string,
    @Body() body: { url: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.addImageToListing(
      listingId,
      user.sub,
      body.url,
      body.isPrimary ?? false,
    );
  }

  /** Remove an image from a listing */
  @UseGuards(JwtAuthGuard)
  @Delete('listings/:listingId/images/:imageId')
  async removeImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromListing(imageId, user.sub);
  }

  /** Reorder images for a listing */
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Delete('parts/images/:imageId')
  async removePartImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromPart(imageId, user.sub);
  }

  // ─── Car Service Image Management ───

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Delete('services/images/:imageId')
  async removeServiceImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadsService.removeImageFromService(imageId, user.sub);
  }

  // ─── Bus Listing Image Management ───

  @UseGuards(JwtAuthGuard)
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

  // ─── Transport Image Management ───

  @UseGuards(JwtAuthGuard)
  @Post('transport/:transportId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addTransportImage(
    @Param('transportId') transportId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { url } = await this.uploadsService.uploadFile(file);
    return this.uploadsService.addImageToTransport(transportId, user.sub, url, isPrimary === 'true');
  }

  // ─── Equipment Image Management ───

  @UseGuards(JwtAuthGuard)
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
}
