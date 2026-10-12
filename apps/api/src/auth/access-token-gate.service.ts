import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from './auth.types';
import { AccountStatus } from '@prisma/client';

export interface CachedTokenMeta {
  tv: number;
  status: AccountStatus;
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
    let meta = await this.redis.get<CachedTokenMeta>(cacheKey);

    if (!meta) {
      // Cache miss or Redis disconnected — query Postgres
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, tokenVersion: true, status: true },
      });

      if (!user) {
        throw new UnauthorizedException('المستخدم غير موجود');
      }

      meta = {
        tv: user.tokenVersion,
        status: user.status,
      };

      // Best effort cache write (silently no-ops if Redis is offline)
      await this.redis.set(cacheKey, meta, TOKEN_GATE_TTL_SECONDS);
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
    await this.redis.del(cacheKey);
  }

  async setCache(userId: string, tv: number, status: AccountStatus): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redis.set(cacheKey, { tv, status }, TOKEN_GATE_TTL_SECONDS);
  }
}
