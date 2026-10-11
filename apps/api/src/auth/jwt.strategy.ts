import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './auth.types';
import { resolveJwtSecretForToken } from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKeyProvider: (_request: any, rawJwtToken: string, done: (err: any, secret?: string) => void) => {
        try {
          const secret = resolveJwtSecretForToken(rawJwtToken);
          done(null, secret);
        } catch (err) {
          done(err);
        }
      },
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.purpose) {
      throw new UnauthorizedException({
        message: 'رمز غير صالح لهذا المسار',
        code: 'INVALID_TOKEN_PURPOSE',
      });
    }

    if (payload.verified !== true) {
      throw new UnauthorizedException({
        message: 'يرجى توثيق البريد الإلكتروني أولاً',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return payload;
  }
}
