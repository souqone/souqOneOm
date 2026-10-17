import * as crypto from 'crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { normalizeEmail } from './auth.validators';

export const SIGNUP_DAILY_IP_CAP = 20;
export const FORGOT_PASSWORD_DAILY_CAP = 5;
export const FORGOT_PASSWORD_GLOBAL_DAILY_CAP = 20;
export const FORGOT_PASSWORD_COOLDOWN_SECONDS = 120; // 2 minutes
export const RESEND_VERIFICATION_DAILY_CAP = 10;
export const RESEND_VERIFICATION_COOLDOWN_SECONDS = 60; // 60 seconds
export const DAY_SECONDS = 24 * 60 * 60; // 86400 seconds

export function hashEmailForRedis(email: string): string {
  const normalized = normalizeEmail(email);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

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
    const normalizedEmail = normalizeEmail(email);
    const lockoutKey = `auth:fail:${normalizedEmail}`;
    const attempts = await this.redis.get<number>(lockoutKey);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.getTTL(lockoutKey);
      return { locked: true, ttlMinutes: Math.max(1, Math.ceil(ttl / 60)) };
    }
    return { locked: false };
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
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
    const normalizedEmail = normalizeEmail(email);
    const lockoutKey = `auth:fail:${normalizedEmail}`;
    const stageKey = `auth:lockstage:${normalizedEmail}`;
    await Promise.all([
      this.redis.del(lockoutKey),
      this.redis.del(stageKey),
    ]);
  }

  async getVerifyAttempts(userId: string): Promise<number> {
    const key = `auth:verify:attempts:${userId}`;
    const attempts = await this.redis.get<number>(key);
    return attempts || 0;
  }

  async recordVerifyFailure(userId: string): Promise<number> {
    const key = `auth:verify:attempts:${userId}`;
    return this.redis.incr(key, 15 * 60);
  }

  async clearVerifyAttempts(userId: string): Promise<void> {
    const key = `auth:verify:attempts:${userId}`;
    await this.redis.del(key);
  }

  /**
   * Checks and records forgot-password rate limits atomically using Redis:
   * 1. 2-minute cooldown per requester (email + ip) using SET NX EX.
   * 2. Daily cap of 5 requests per requester (email + ip) per 24 hours using INCR + EXPIRE.
   * 3. Global cap of 20 requests per email per 24 hours across all IPs (only incremented if 1 & 2 succeed).
   * Email is normalized and hashed with SHA-256 before forming keys.
   * Returns true if allowed, false if limit exceeded. Fail-open on Redis errors.
   */
  async checkAndRecordForgotPasswordLimit(email: string, ip?: string): Promise<boolean> {
    const safeIp = ip || 'unknown';
    const emailHash = hashEmailForRedis(email);
    const hashPrefix = emailHash.slice(0, 8);
    const cooldownKey = `auth:forgot:cooldown:${emailHash}:${safeIp}`;
    const dailyKey = `auth:forgot:daily:${emailHash}:${safeIp}`;
    const globalKey = `auth:forgot:global:${emailHash}`;

    try {
      const cooldownStatus = await this.redis.trySetNX(cooldownKey, '1', FORGOT_PASSWORD_COOLDOWN_SECONDS);

      if (cooldownStatus === 'unavailable') {
        this.logger.warn(`Redis unavailable during forgot-password check (fail-open)`);
        return true;
      }

      if (cooldownStatus === 'exists') {
        this.logger.warn(`Forgot-password throttled for emailHash=${hashPrefix} reason=cooldown`);
        return false;
      }

      const count = await this.redis.incr(dailyKey, DAY_SECONDS);
      if (count > FORGOT_PASSWORD_DAILY_CAP) {
        this.logger.warn(`Forgot-password throttled for emailHash=${hashPrefix} reason=per-requester`);
        return false;
      }

      const globalCount = await this.redis.incr(globalKey, DAY_SECONDS);
      if (globalCount > FORGOT_PASSWORD_GLOBAL_DAILY_CAP) {
        this.logger.warn(`Forgot-password throttled for emailHash=${hashPrefix} reason=global`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.warn(`Redis forgot-password limit check failed (fail-open): ${(err as Error).message}`);
      return true;
    }
  }

  /**
   * Asserts resend-verification rate limits for a user:
   * 1. 60-second cooldown using SET NX EX. Throws 429 RESEND_COOLDOWN if active.
   * 2. Daily cap of 10 requests per 24 hours using INCR + EXPIRE. Throws 429 RESEND_DAILY_LIMIT_EXCEEDED if exceeded.
   * Fail-open on Redis errors.
   */
  async assertResendVerificationLimit(userId: string): Promise<void> {
    const cooldownKey = `auth:resend:cooldown:${userId}`;
    const dailyKey = `auth:resend:daily:${userId}`;

    try {
      const cooldownStatus = await this.redis.trySetNX(cooldownKey, '1', RESEND_VERIFICATION_COOLDOWN_SECONDS);

      if (cooldownStatus === 'unavailable') {
        this.logger.warn(`Redis unavailable during resend-verification check (fail-open)`);
        return;
      }

      if (cooldownStatus === 'exists') {
        let ttl = 60;
        try {
          ttl = await this.redis.getTTL(cooldownKey);
        } catch {}
        throw new HttpException(
          {
            statusCode: 429,
            code: 'RESEND_COOLDOWN',
            message: 'يرجى الانتظار دقيقة قبل طلب رمز تحقق جديد',
            retryAfterSeconds: Math.max(1, ttl),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const count = await this.redis.incr(dailyKey, DAY_SECONDS);
      if (count > RESEND_VERIFICATION_DAILY_CAP) {
        throw new HttpException(
          {
            statusCode: 429,
            code: 'RESEND_DAILY_LIMIT_EXCEEDED',
            message: 'تم تجاوز الحد اليومي لإعادة إرسال رمز التحقق (10 محاولات)',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Redis resend-verification limit check failed (fail-open): ${(err as Error).message}`);
    }
  }

  /**
   * Asserts signup IP rate limit:
   * 20 successful new accounts per 24 hours per IP.
   * Throws 429 SIGNUP_IP_LIMIT_EXCEEDED if count >= 20. Fail-open on Redis errors.
   */
  async assertSignupIpLimit(ip?: string): Promise<void> {
    if (!ip) return;
    const ipKey = `auth:signup:ip:${ip}`;

    try {
      const current = await this.redis.get<number>(ipKey);
      if (current !== null && Number(current) >= SIGNUP_DAILY_IP_CAP) {
        throw new HttpException(
          {
            statusCode: 429,
            code: 'SIGNUP_IP_LIMIT_EXCEEDED',
            message: `تم تجاوز الحد الأقصى لإنشاء الحسابات اليوم من هذه الشبكة (${SIGNUP_DAILY_IP_CAP} حساباً). يرجى المحاولة لاحقاً.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Redis signup IP limit check failed (fail-open): ${(err as Error).message}`);
    }
  }

  /**
   * Records successful account creation for an IP address.
   * Atomically increments the daily counter with TTL of 86400 seconds.
   */
  async recordSignupSuccess(ip?: string): Promise<void> {
    if (!ip) return;
    const ipKey = `auth:signup:ip:${ip}`;

    try {
      await this.redis.incr(ipKey, DAY_SECONDS);
    } catch (err) {
      this.logger.warn(`Redis record signup success failed: ${(err as Error).message}`);
    }
  }
}
