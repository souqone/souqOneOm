import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { BookingEntityResolverService } from './booking-entity-resolver.service';
import { BookingNotificationService } from './booking-notification.service';
import { BookingPricingService } from './booking-pricing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository, BookingEntityResolverService, BookingNotificationService, BookingPricingService],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
