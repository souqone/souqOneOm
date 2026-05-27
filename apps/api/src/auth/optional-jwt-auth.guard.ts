import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No token or invalid token is fine for optional auth
    }
    return true;
  }

  handleRequest<T>(_err: unknown, user: T): T | null {
    return user || null;
  }
}
