import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import type { User } from '@prisma/client';
import type { JwtPayload } from './auth.types';

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
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user));
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: hashedToken, userId, expiresAt },
    });

    return token;
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });
    if (stored && !stored.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const hashedToken = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return null as any;
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return null as any;

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  sanitizeUser(user: User) {
    const { passwordHash, emailVerificationCode, emailVerificationExpiry, passwordResetCode, passwordResetExpiry, ...safeUser } = user;
    return safeUser;
  }

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
