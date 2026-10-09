import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '../../auth/auth.types';
import { verifyAccessToken } from '../../config/jwt.config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = verifyAccessToken<JwtPayload>(token);

      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}
