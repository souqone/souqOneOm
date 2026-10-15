import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtVerifyStrategy } from './jwt-verify.strategy';
import { VerificationGuard } from './verification.guard';
import { TokenCleanupService } from './token-cleanup.service';
import { AccessTokenGate } from './access-token-gate.service';
import { AccountStatusService } from './account-status.service';
import { getJwtModuleOptions } from '../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => getJwtModuleOptions(),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthAuditService,
    OtpService,
    JwtStrategy,
    JwtVerifyStrategy,
    VerificationGuard,
    TokenCleanupService,
    AccessTokenGate,
    AccountStatusService,
  ],
  exports: [AuthTokenService, VerificationGuard, OtpService, AccessTokenGate, AccountStatusService],
})
export class AuthModule {}
