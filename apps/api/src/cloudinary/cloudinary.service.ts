import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import type { CloudinaryResourceType } from '../uploads/chat-media.constants';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || '',
    });
  }

  async upload(
    file: Express.Multer.File,
    folder = 'carone',
    resourceType: CloudinaryResourceType = 'image',
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(publicId ? { public_id: publicId } : {}),
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            reject(error);
          } else {
            resolve(result!);
          }
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async delete(
    publicId: string,
    resourceType: CloudinaryResourceType = 'image',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      this.logger.log(`Deleted from Cloudinary (${resourceType}): ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete from Cloudinary (${resourceType}): ${publicId}`,
        error,
      );
    }
  }
}
