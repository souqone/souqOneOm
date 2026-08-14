import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EquipmentListingsService } from './equipment-listings.service';
import { EquipmentController } from './equipment.controller';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule, RedisModule, UploadsModule],
  controllers: [EquipmentController],
  providers: [EquipmentListingsService],
  exports: [EquipmentListingsService],
})
export class EquipmentModule {}
