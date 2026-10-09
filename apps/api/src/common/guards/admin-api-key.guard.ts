import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY;

    if (!expected) {
      throw new ForbiddenException('Admin access not configured');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new ForbiddenException('Invalid admin key');
    }

    const keyBuf = Buffer.from(apiKey);
    const expectedBuf = Buffer.from(expected);

    if (keyBuf.length !== expectedBuf.length) {
      throw new ForbiddenException('Invalid admin key');
    }

    if (!crypto.timingSafeEqual(keyBuf, expectedBuf)) {
      throw new ForbiddenException('Invalid admin key');
    }

    return true;
  }
}
