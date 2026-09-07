import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { AdminOperatorsController } from './admin-operators.controller';

@Module({
  imports: [LocationsModule, PrismaModule, NotificationsModule],
  controllers: [OperatorsController, AdminOperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
