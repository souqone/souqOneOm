import { Injectable } from '@nestjs/common';
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
    return payload;
  }
}
