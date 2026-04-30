import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

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
    const lockoutKey = `auth:fail:${email}`;
    const attempts = await this.redis.get<number>(lockoutKey);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.getTTL(lockoutKey);
      return { locked: true, ttlMinutes: Math.ceil(ttl / 60) };
    }
    return { locked: false };
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const lockoutKey = `auth:fail:${email}`;
    await this.redis.incr(lockoutKey, LOCKOUT_DURATION_SECONDS);
  }

  async resetLockout(email: string): Promise<void> {
    const lockoutKey = `auth:fail:${email}`;
    await this.redis.del(lockoutKey);
  }
}
