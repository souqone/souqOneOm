import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { ChatModule } from './chat/chat.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CarsModule } from './cars/cars.module';
import { BookingsModule } from './bookings/bookings.module';
import { JobsModule } from './jobs/jobs.module';
import { PartsModule } from './parts/parts.module';
import { ServicesModule } from './services/services.module';
import { SearchModule } from './search/search.module';
import { BusesModule } from './buses/buses.module';
import { EquipmentModule } from './equipment/equipment.module';
import { OperatorsModule } from './operators/operators.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { TransportModule } from './transport/transport.module';
import { ListingNotificationListener } from './common/listeners/listing-notification.listener';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    ChatModule,
    FavoritesModule,
    NotificationsModule,
    UploadsModule,
    MailModule,
    CloudinaryModule,
    CarsModule,
    BookingsModule,
    JobsModule,
    PartsModule,
    ServicesModule,
    SearchModule,
    BusesModule,
    EquipmentModule,
    OperatorsModule,
    ReviewsModule,
    PaymentsModule,
    TransportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ListingNotificationListener,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
