import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const MAX_LOGIN_ATTEMPTS = 10;
const BASE_ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes
const STAGE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function getLockoutDuration(stage: number): number {
  if (stage <= 1) return 15 * 60; // 15 minutes
  if (stage === 2) return 60 * 60; // 1 hour
  return 24 * 60 * 60; // 24 hours (cap)
}

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async logAudit(data: {
    email: string; userId?: string; success: boolean;
    method?: string; reason?: string; ip?: string; userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.loginAudit.create({
        data: {
          email: data.email,
          userId: data.userId,
          success: data.success,
          method: data.method || 'EMAIL',
          ipAddress: data.ip,
          userAgent: data.userAgent,
          reason: data.reason,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write login audit', err);
    }
  }

  async checkLockout(email: string): Promise<{ locked: boolean; ttlMinutes?: number }> {
    const normalizedEmail = email.trim().toLowerCase();
    const lockoutKey = `auth:fail:${normalizedEmail}`;
    const attempts = await this.redis.get<number>(lockoutKey);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.getTTL(lockoutKey);
      return { locked: true, ttlMinutes: Math.max(1, Math.ceil(ttl / 60)) };
    }
    return { locked: false };
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const lockoutKey = `auth:fail:${normalizedEmail}`;
    const stageKey = `auth:lockstage:${normalizedEmail}`;

    const attempts = await this.redis.incr(lockoutKey, BASE_ATTEMPT_WINDOW_SECONDS);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const currentStage = (await this.redis.get<number>(stageKey)) || 0;
      const nextStage = Math.min(Number(currentStage) + 1, 3);
      const duration = getLockoutDuration(nextStage);

      await this.redis.set(stageKey, nextStage, STAGE_TTL_SECONDS);
      await this.redis.expire(lockoutKey, duration);
    }
  }

  async resetLockout(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const lockoutKey = `auth:fail:${normalizedEmail}`;
    const stageKey = `auth:lockstage:${normalizedEmail}`;
    await Promise.all([
      this.redis.del(lockoutKey),
      this.redis.del(stageKey),
    ]);
  }
}
