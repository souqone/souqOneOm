import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PhoneOtpService } from './phone-otp.service';
import { WhatsappLimitsService } from './whatsapp-limits.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import {
  WhatsappSenderProvider,
  MockWhatsappOtpSender,
  MetaWhatsappOtpSender,
  DisabledWhatsappOtpSender,
  WHATSAPP_OTP_SENDER,
} from './senders';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WhatsappWebhookController],
  providers: [
    PhoneOtpService,
    WhatsappLimitsService,
    WhatsappSenderProvider,
    MockWhatsappOtpSender,
    MetaWhatsappOtpSender,
    DisabledWhatsappOtpSender,
  ],
  exports: [PhoneOtpService, WhatsappLimitsService, WHATSAPP_OTP_SENDER],
})
export class WhatsappModule {}
