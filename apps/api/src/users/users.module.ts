import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [NotificationsModule, LocationsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
