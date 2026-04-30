import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ThawaniService } from './thawani.service';
import { PaymentActivationService } from './payment-activation.service';
import { PaymentsCronService } from './payments-cron.service';
import { PaymentWebhookProcessor, PAYMENT_WEBHOOK_QUEUE, PAYMENT_DLQ } from './payment-webhook.processor';
import { AdminPaymentsController } from './admin-payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({ name: PAYMENT_WEBHOOK_QUEUE }),
    BullModule.registerQueue({ name: PAYMENT_DLQ }),
    NotificationsModule,
  ],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, ThawaniService, PaymentActivationService, PaymentsCronService, PaymentWebhookProcessor],
  exports: [PaymentsService, ThawaniService],
})
export class PaymentsModule {}
