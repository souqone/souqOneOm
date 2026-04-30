import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

@Injectable()
export class UploadFileStorageService {
  private readonly logger = new Logger(UploadFileStorageService.name);
  private readonly useCloudinary: boolean;

  constructor(private readonly cloudinaryService: CloudinaryService) {
    this.useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
    if (!this.useCloudinary) {
      this.logger.warn('Cloudinary not configured — using local file storage');
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('لم يتم تحميل أي ملف');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP, AVIF');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد الأقصى (10MB)');
    }

    if (this.useCloudinary) {
      const result = await this.cloudinaryService.upload(file, 'carone/listings');
      return { url: result.secure_url, key: result.public_id };
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const dest = path.join(UPLOAD_DIR, key);
    fs.writeFileSync(dest, file.buffer);
    return { url: `/uploads/${key}`, key };
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useCloudinary && key.startsWith('carone/')) {
      await this.cloudinaryService.delete(key);
      return;
    }
    const filePath = path.join(UPLOAD_DIR, path.basename(key));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
