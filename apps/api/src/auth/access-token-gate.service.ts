import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from './auth.types';
import { AccountStatus, UserRole } from '@prisma/client';

export interface CachedTokenMeta {
  tv: number;
  status: AccountStatus;
  role: UserRole;
}

const TOKEN_GATE_TTL_SECONDS = 300;

@Injectable()
export class AccessTokenGate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(userId: string): string {
    return `auth:tv:${userId}`;
  }

  async validate(payload: JwtPayload): Promise<CachedTokenMeta> {
    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException('رمز الدخول غير صالح');
    }

    const cacheKey = this.getCacheKey(userId);
    let meta: CachedTokenMeta | null = null;

    try {
      meta = await this.redis.get<CachedTokenMeta>(cacheKey);
    } catch {
      meta = null;
    }

    const isValidMeta =
      meta !== null &&
      typeof meta === 'object' &&
      typeof meta.tv === 'number' &&
      typeof meta.status === 'string' &&
      typeof meta.role === 'string' &&
      Object.values(UserRole).includes(meta.role as UserRole);

    if (!isValidMeta) {
      // Cache miss, corrupted cache, or Redis offline — query Postgres
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, tokenVersion: true, status: true, role: true },
        });
      } catch {
        // If Postgres query fails with exception, fail closed with 401
        throw new UnauthorizedException('فشل التحقق من صلاحية الجلسة');
      }

      if (!user) {
        throw new UnauthorizedException('المستخدم غير موجود');
      }

      meta = {
        tv: user.tokenVersion,
        status: user.status,
        role: user.role,
      };

      // Best effort cache write (silently no-ops if Redis is offline)
      try {
        await this.redis.set(cacheKey, meta, TOKEN_GATE_TTL_SECONDS);
      } catch {
        // Ignore cache write errors
      }
    }

    if (!meta) {
      throw new UnauthorizedException('فشل التحقق من صلاحية الجلسة');
    }

    // Account status check
    if (meta.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('الحساب غير نشط أو محظور');
    }

    // Version check (grace transition: tokens without tv claim are accepted)
    if (payload.tv !== undefined && payload.tv < meta.tv) {
      throw new UnauthorizedException('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
    }

    return meta;
  }

  async invalidate(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    try {
      await this.redis.del(cacheKey);
    } catch {
      // Ignore cache del errors
    }
  }

  async setCache(userId: string, tv: number, status: AccountStatus, role: UserRole): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    try {
      await this.redis.set(cacheKey, { tv, status, role }, TOKEN_GATE_TTL_SECONDS);
    } catch {
      // Ignore cache set errors
    }
  }
}
