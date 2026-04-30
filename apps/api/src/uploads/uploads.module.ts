import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadFileStorageService } from './upload-file-storage.service';
import { UploadImageManagerService } from './upload-image-manager.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadFileStorageService, UploadImageManagerService],
  exports: [UploadsService],
})
export class UploadsModule {}
