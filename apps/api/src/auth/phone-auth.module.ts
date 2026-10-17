import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { BanBlacklistModule } from '../ban-blacklist/ban-blacklist.module';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';

@Module({
  imports: [PrismaModule, AuthModule, WhatsappModule, BanBlacklistModule],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
