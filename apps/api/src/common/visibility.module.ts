import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { OwnerContentVisibilityService } from './services/owner-content-visibility.service';
import { UserStatusVisibilityListener } from './listeners/user-status-visibility.listener';
import { VisibilityReconciliationCron } from './crons/visibility-reconciliation.cron';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    OwnerContentVisibilityService,
    UserStatusVisibilityListener,
    VisibilityReconciliationCron,
  ],
  exports: [OwnerContentVisibilityService],
})
export class VisibilityModule {}
