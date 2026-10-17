import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PhoneOtpService } from './phone-otp.service';
import { WhatsappLimitsService } from './whatsapp-limits.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';
import {
  WhatsappSenderProvider,
  WHATSAPP_OTP_SENDER,
} from './senders';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WhatsappWebhookController, PhoneVerificationController],
  providers: [
    PhoneOtpService,
    WhatsappLimitsService,
    WhatsappSenderProvider,
    PhoneVerificationService,
  ],
  exports: [
    PhoneOtpService,
    WhatsappLimitsService,
    WHATSAPP_OTP_SENDER,
    PhoneVerificationService,
  ],
})
export class WhatsappModule {}
