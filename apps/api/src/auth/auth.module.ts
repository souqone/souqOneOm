import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenCleanupService } from './token-cleanup.service';
import { getJwtSecret } from '../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: {
          expiresIn: process.env.JWT_EXPIRATION || '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, AuthAuditService, JwtStrategy, TokenCleanupService],
})
export class AuthModule {}
