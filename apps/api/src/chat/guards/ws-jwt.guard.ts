import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '../../auth/auth.types';
import { verifyAccessToken } from '../../config/jwt.config';
import { assertVerifiedAccessPayload } from '../../auth/auth-token.validator';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new WsException('غير مصرح: لم يتم توفير رمز الدخول');
    }

    try {
      const payload = verifyAccessToken<JwtPayload>(token);
      assertVerifiedAccessPayload(payload);

      client.data.user = payload;
      return true;
    } catch (err: any) {
      const message = err?.response?.message || err?.message || 'غير مصرح: رمز الدخول غير صالح';
      throw new WsException(message);
    }
  }
}
