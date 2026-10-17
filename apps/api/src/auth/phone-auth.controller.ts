import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PhoneAuthService } from './phone-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ExposePhone } from '../common/decorators/expose-phone.decorator';

@Controller('auth/otp')
export class PhoneAuthController {
  constructor(private readonly phoneAuthService: PhoneAuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('request')
  request(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.phoneAuthService.requestOtp(dto, req.ip);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ExposePhone()
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  verify(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.phoneAuthService.verifyOtp(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
