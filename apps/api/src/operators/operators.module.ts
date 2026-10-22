import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';
import { OperatorsService } from './operators.service';
import { OperatorViewCounterService } from './operator-view-counter.service';
import { OperatorsController } from './operators.controller';
import { AdminOperatorsController } from './admin-operators.controller';

@Module({
  imports: [LocationsModule, PrismaModule, NotificationsModule, RedisModule],
  controllers: [OperatorsController, AdminOperatorsController],
  providers: [OperatorsService, OperatorViewCounterService],
  exports: [OperatorsService, OperatorViewCounterService],
})
export class OperatorsModule {}
