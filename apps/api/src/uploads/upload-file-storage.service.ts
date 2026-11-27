import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CHAT_MEDIA_RULES,
  CHAT_UPLOAD_FOLDER,
  LISTINGS_UPLOAD_FOLDER,
  LOCAL_UPLOAD_PREFIX,
} from './chat-media.constants';
import {
  buildCloudinaryStorageKey,
  parseStorageKey,
  validateChatMediaFile,
} from './chat-media.validator';

const MAX_FILE_SIZE = CHAT_MEDIA_RULES.IMAGE.maxBytes;
const ALLOWED_MIME = CHAT_MEDIA_RULES.IMAGE.mimes;

@Injectable()
export class UploadFileStorageService {
  private readonly logger = new Logger(UploadFileStorageService.name);
  private readonly useCloudinary: boolean;

  private get uploadDir(): string {
    return path.join(process.cwd(), 'uploads');
  }

  private get chatUploadDir(): string {
    return path.join(this.uploadDir, 'chat');
  }

  constructor(private readonly cloudinaryService: CloudinaryService) {
    this.useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
    if (!this.useCloudinary) {
      this.logger.warn('Cloudinary not configured — using local file storage');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('لم يتم تحميل أي ملف');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP, AVIF, HEIC');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد الأقصى (10MB)');
    }

    if (this.useCloudinary) {
      const result = await this.cloudinaryService.upload(file, LISTINGS_UPLOAD_FOLDER);
      return { url: result.secure_url, key: result.public_id };
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const dest = path.join(this.uploadDir, key);
    fs.writeFileSync(dest, file.buffer);
    return { url: `${LOCAL_UPLOAD_PREFIX}${key}`, key };
  }

  async uploadChatMedia(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const { rule, safeExtension } = validateChatMediaFile(file);

    if (this.useCloudinary) {
      // Raw Cloudinary uploads require explicit extension in public_id so URL and destroy() match
      const publicId =
        rule.cloudinaryResourceType === 'raw' ? `${randomUUID()}${safeExtension}` : undefined;
      const result = await this.cloudinaryService.upload(
        file,
        CHAT_UPLOAD_FOLDER,
        rule.cloudinaryResourceType,
        publicId,
      );
      return {
        url: result.secure_url,
        key: buildCloudinaryStorageKey(rule.cloudinaryResourceType, result.public_id),
      };
    }

    if (!fs.existsSync(this.chatUploadDir)) {
      fs.mkdirSync(this.chatUploadDir, { recursive: true });
    }
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${safeExtension}`;
    const dest = path.join(this.chatUploadDir, filename);
    fs.writeFileSync(dest, file.buffer);
    const key = `chat/${filename}`;
    return { url: `${LOCAL_UPLOAD_PREFIX}${key}`, key };
  }

  async deleteFile(key: string): Promise<void> {
    const parsed = parseStorageKey(key);
    if (!parsed) {
      return;
    }

    if (parsed.kind === 'cloudinary') {
      if (this.useCloudinary) {
        await this.cloudinaryService.delete(parsed.publicId, parsed.resourceType);
      }
      return;
    }

    const resolvedRoot = path.resolve(this.uploadDir);
    const filePath = path.resolve(resolvedRoot, parsed.relativePath);
    if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
      return;
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
