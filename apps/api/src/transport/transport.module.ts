import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { AdminTransportController } from './admin-transport.controller';
import { CarrierProfileService } from './carrier-profile.service';
import { TransportRequestService } from './transport-request.service';
import { TransportQuoteService } from './transport-quote.service';
import { TransportBookingService } from './transport-booking.service';
import { TransportReviewService } from './transport-review.service';
import { TransportExpiryService } from './transport-expiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [PrismaModule, RedisModule, NotificationsModule, SearchModule],
  controllers: [TransportController, AdminTransportController],
  providers: [
    CarrierProfileService,
    TransportRequestService,
    TransportQuoteService,
    TransportBookingService,
    TransportReviewService,
    TransportExpiryService,
  ],
})
export class TransportModule {}
