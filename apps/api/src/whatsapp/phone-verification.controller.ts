import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { PhoneVerificationService } from './phone-verification.service';
import { VerifyPhoneDto } from './dto/verify-phone.dto';

@Controller('users/me/phone')
export class PhoneVerificationController {
  constructor(
    private readonly phoneVerificationService: PhoneVerificationService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('request')
  async requestVerification(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.phoneVerificationService.requestVerification(user.sub, req.ip);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyPhone(
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyPhoneDto,
  ) {
    return this.phoneVerificationService.verifyPhone(user.sub, dto.code);
  }
}
