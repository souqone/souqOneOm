import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    let userId = req.user?.sub;
    
    // Fallback naive JWT decode if ThrottlerGuard runs before AuthGuard
    if (!userId && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      } catch (e) {
        // ignore invalid token, fallback to IP
      }
    }

    if (userId) {
      return `user-${userId}`;
    }
    
    return `ip-${req.ip || req.connection?.remoteAddress}`;
  }

  protected generateKey(context: ExecutionContext, _suffix: string, name: string): string {
    const req = context.switchToHttp().getRequest();
    // We override generateKey to ensure our custom logic from getTracker is used
    // if getTracker is deprecated in newer versions. Let's just do it here:
    let userId = req.user?.sub;
    if (!userId && req.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      } catch (e) {}
    }
    
    const finalTracker = userId ? `user-${userId}` : `ip-${req.ip}`;
    return `${name}:${finalTracker}:${context.getClass().name}-${context.getHandler().name}`;
  }
}
