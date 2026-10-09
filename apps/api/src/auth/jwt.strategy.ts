import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from './auth.types';
import { getJwtSecret, getJwtPreviousSecret } from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKeyProvider: (_request: any, rawJwtToken: string, done: (err: any, secret?: string) => void) => {
        const currentSecret = getJwtSecret();
        const previousSecret = getJwtPreviousSecret();

        if (!previousSecret) {
          return done(null, currentSecret);
        }

        try {
          jwt.verify(rawJwtToken, currentSecret, { algorithms: ['HS256'], ignoreExpiration: true });
          return done(null, currentSecret);
        } catch {
          try {
            jwt.verify(rawJwtToken, previousSecret, { algorithms: ['HS256'], ignoreExpiration: true });
            return done(null, previousSecret);
          } catch {
            return done(null, currentSecret);
          }
        }
      },
    });
  }


  async validate(payload: JwtPayload) {
    return payload;
  }
}
