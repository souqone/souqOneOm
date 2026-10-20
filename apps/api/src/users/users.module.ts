import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccountDeletionJob } from './account-deletion.job';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';
import { AuthModule } from '../auth/auth.module';
import { VisibilityModule } from '../common/visibility.module';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BanBlacklistModule } from '../ban-blacklist/ban-blacklist.module';

@Module({
  imports: [
    NotificationsModule,
    LocationsModule,
    AuthModule,
    VisibilityModule,
    MailModule,
    RedisModule,
    CloudinaryModule,
    BanBlacklistModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AccountDeletionJob],
  exports: [UsersService, AccountDeletionJob],
})
export class UsersModule {}
