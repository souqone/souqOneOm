import { Injectable, Logger, Optional, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenGate } from './access-token-gate.service';
import { USER_STATUS_CHANGED, UserStatusChangedPayload } from '../common/events/user-status.events';

export interface UserStatusInput {
  id: string;
  status: string;
  suspendedUntil?: Date | string | null;
}

@Injectable()
export class AccountStatusService {
  private readonly logger = new Logger(AccountStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessTokenGate: AccessTokenGate,
    @Optional()
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * Enforces account status rules during authentication.
   * - ACTIVE: passes cleanly.
   * - DELETED: throws UnauthorizedException with generic message (no leakage).
   * - BANNED: throws ForbiddenException with ACCOUNT_BANNED code.
   * - SUSPENDED (active or indefinite): throws ForbiddenException with ACCOUNT_SUSPENDED code & ISO date.
   * - SUSPENDED (expired): lazily lifts suspension concurrency-safely, invalidates token gate, emits event, and allows authentication to proceed.
   */
  async assertCanAuthenticate(user: UserStatusInput): Promise<void> {
    if (user.status === 'ACTIVE') {
      return;
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
      });
    }

    if (user.status === 'SUSPENDED') {
      const now = new Date();
      const suspendedUntilDate = user.suspendedUntil ? new Date(user.suspendedUntil) : null;

      // Active suspension: either indefinite (null) or expires in future
      if (!suspendedUntilDate || suspendedUntilDate.getTime() > now.getTime()) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
          suspendedUntil: suspendedUntilDate ? suspendedUntilDate.toISOString() : null,
        });
      }

      // Expired suspension: lazily lift with concurrency-safe updateMany
      const updateResult = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          status: 'SUSPENDED',
          suspendedUntil: { lte: now },
        },
        data: {
          status: 'ACTIVE',
          suspendedUntil: null,
          statusChangedAt: now,
        },
      });

      if (updateResult.count > 0) {
        await this.accessTokenGate.invalidate(user.id);
        const payload: UserStatusChangedPayload = {
          userId: user.id,
          previousStatus: 'SUSPENDED',
          status: 'ACTIVE',
          suspendedUntil: null,
          at: now,
        };
        this.eventEmitter?.emit(USER_STATUS_CHANGED, payload);
      }

      user.status = 'ACTIVE';
      user.suspendedUntil = null;
      return;
    }

    // Any other inactive status: generic 401 without leakage
    throw new UnauthorizedException('بيانات الدخول غير صحيحة');
  }

  /**
   * Periodic cron job to lift expired suspensions in batches.
   * Rate limited to 500 users per run.
   * Safe with concurrency, no PII logged, won't crash on individual user error.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async liftExpiredSuspensions(): Promise<void> {
    try {
      const now = new Date();
      const expiredUsers = await this.prisma.user.findMany({
        where: {
          status: 'SUSPENDED',
          suspendedUntil: { lte: now },
        },
        select: { id: true },
        take: 500,
      });

      if (expiredUsers.length === 0) {
        return;
      }

      for (const u of expiredUsers) {
        try {
          const updateResult = await this.prisma.user.updateMany({
            where: {
              id: u.id,
              status: 'SUSPENDED',
              suspendedUntil: { lte: now },
            },
            data: {
              status: 'ACTIVE',
              suspendedUntil: null,
              statusChangedAt: now,
            },
          });

          if (updateResult.count > 0) {
            await this.accessTokenGate.invalidate(u.id);
            const payload: UserStatusChangedPayload = {
              userId: u.id,
              previousStatus: 'SUSPENDED',
              status: 'ACTIVE',
              suspendedUntil: null,
              at: now,
            };
            this.eventEmitter?.emit(USER_STATUS_CHANGED, payload);
          }
        } catch (err: any) {
          this.logger.warn(`Failed to lift suspension for user ${u.id}: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Error running liftExpiredSuspensions cron: ${err.message}`);
    }
  }
}
