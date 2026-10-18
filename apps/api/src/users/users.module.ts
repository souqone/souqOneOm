import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';
import { AuthModule } from '../auth/auth.module';
import { VisibilityModule } from '../common/visibility.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NotificationsModule, LocationsModule, AuthModule, VisibilityModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
