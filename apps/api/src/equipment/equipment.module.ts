import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EquipmentListingsService } from './equipment-listings.service';
import { EquipmentRequestsService } from './equipment-requests.service';
import { EquipmentBidsService } from './equipment-bids.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentRequestsController } from './equipment-requests.controller';

@Module({
  imports: [PrismaModule, RedisModule, UploadsModule],
  controllers: [EquipmentController, EquipmentRequestsController],
  providers: [EquipmentListingsService, EquipmentRequestsService, EquipmentBidsService],
  exports: [EquipmentListingsService, EquipmentRequestsService, EquipmentBidsService],
})
export class EquipmentModule {}
