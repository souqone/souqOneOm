import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import type { User } from '@prisma/client';
import type { JwtPayload } from './auth.types';
import { REFRESH_GRACE_SECONDS, VERIFICATION_TOKEN_TTL } from './auth.constants';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email ?? undefined,
      username: user.username,
      role: user.role,
      verified: user.isVerified === true,
      tv: user.tokenVersion,
    };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user));
  }

  async signVerificationToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, purpose: 'email-verify' },
      { expiresIn: VERIFICATION_TOKEN_TTL },
    );
  }

  async generateRefreshToken(userId: string, familyId?: string, tx?: any): Promise<string> {
    const client = tx || this.prisma;
    const token = crypto.randomBytes(64).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const actualFamilyId = familyId || crypto.randomUUID();

    await client.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        familyId: actualFamilyId,
        expiresAt,
      },
    });

    return token;
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });
    if (!stored) {
      return;
    }

    const now = new Date();
    if (stored.familyId) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: now },
      });
    } else {
      if (!stored.revokedAt) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: now },
        });
      }
    }
  }

  async revokeAllRefreshTokens(userId: string, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    await client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const hashedToken = this.hashToken(rawToken);
    const now = new Date();

    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });

    // (1) Check existence & expiration
    if (!stored || stored.expiresAt < now) {
      return null;
    }

    const effectiveFamilyId = stored.familyId || stored.id;

    const handleRevoked = async (tokenRow: typeof stored): Promise<{ accessToken: string; refreshToken: string } | null> => {
      if (tokenRow.rotatedAt) {
        const diffSeconds = (now.getTime() - tokenRow.rotatedAt.getTime()) / 1000;
        if (diffSeconds <= REFRESH_GRACE_SECONDS) {
          // Grace period: natural race condition
          const user = await this.prisma.user.findUnique({ where: { id: tokenRow.userId } });
          if (!user || !user.isVerified || (user.status ?? 'ACTIVE') !== 'ACTIVE') {
            return null;
          }
          const accessToken = await this.signAccessToken(user);
          const refreshToken = await this.generateRefreshToken(user.id, effectiveFamilyId);
          return { accessToken, refreshToken };
        } else {
          // Beyond grace period: malicious reuse of rotated token!
          // Revoke the entire family
          if (tokenRow.familyId) {
            await this.prisma.refreshToken.updateMany({
              where: { familyId: tokenRow.familyId, revokedAt: null },
              data: { revokedAt: now },
            });
          } else {
            await this.prisma.refreshToken.updateMany({
              where: { id: tokenRow.id, revokedAt: null },
              data: { revokedAt: now },
            });
          }
          return null;
        }
      }

      // rotatedAt is null (e.g. explicit logout or revocation without rotation)
      return null;
    };

    // (2) If already revoked:
    if (stored.revokedAt) {
      return handleRevoked(stored);
    }

    // (3) If active: verify user exists, is verified, and is ACTIVE before consuming token
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isVerified || (user.status ?? 'ACTIVE') !== 'ACTIVE') {
      return null;
    }

    // (4) & (5) Atomic transition
    return await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now, rotatedAt: now },
      });

      if (updateResult.count !== 1) {
        // Lost race condition: someone else rotated or revoked it concurrently
        const reRead = await tx.refreshToken.findUnique({ where: { id: stored.id } });
        if (!reRead) return null;
        return handleRevoked(reRead);
      }

      const newTokenRaw = crypto.randomBytes(64).toString('hex');
      const newHashedToken = this.hashToken(newTokenRaw);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

      const newRow = await tx.refreshToken.create({
        data: {
          token: newHashedToken,
          userId: user.id,
          familyId: effectiveFamilyId,
          expiresAt: newExpiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { replacedById: newRow.id },
      });

      const accessToken = await this.signAccessToken(user);
      return { accessToken, refreshToken: newTokenRaw };
    });
  }

  sanitizeUser(user: User) {
    const {
      passwordHash,
      googleId,
      emailVerificationCode,
      emailVerificationExpiry,
      passwordResetCode,
      passwordResetExpiry,
      ...safeUser
    } = user;
    return safeUser;
  }

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
