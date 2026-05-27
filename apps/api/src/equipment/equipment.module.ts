import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EquipmentListingsService } from './equipment-listings.service';
import { EquipmentController } from './equipment.controller';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [PrismaModule, RedisModule, UploadsModule],
  controllers: [EquipmentController, OperatorsController],
  providers: [EquipmentListingsService, OperatorsService],
  exports: [EquipmentListingsService],
})
export class EquipmentModule {}
