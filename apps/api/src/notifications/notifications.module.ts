import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { ExpoPushService } from './expo-push.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, ExpoPushService],
  exports: [NotificationsService, PushService, ExpoPushService],
})
export class NotificationsModule {}
