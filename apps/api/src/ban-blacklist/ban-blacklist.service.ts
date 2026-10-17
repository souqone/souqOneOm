import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { BanBlacklistKind, Prisma, AuthProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getAuthPepper } from '../config/pepper.config';

export function computeBanBlacklistHash(
  kind: 'PHONE' | 'GOOGLE' | BanBlacklistKind,
  rawValue: string,
  pepper: string = getAuthPepper(),
): string {
  const prefix = kind === 'PHONE' ? 'BAN_BLACKLIST:PHONE:' : 'BAN_BLACKLIST:GOOGLE:';
  return crypto
    .createHmac('sha256', pepper)
    .update(`${prefix}${rawValue}`)
    .digest('hex');
}

@Injectable()
export class BanBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  hashPhone(phoneE164: string, pepper?: string): string {
    return computeBanBlacklistHash('PHONE', phoneE164, pepper);
  }

  hashGoogle(googleId: string, pepper?: string): string {
    return computeBanBlacklistHash('GOOGLE', googleId, pepper);
  }

  /**
   * Adds blacklist entries for a user inside an existing Prisma transaction.
   * Idempotent (ignores duplicates if already blacklisted).
   */
  async addForUser(
    tx: Prisma.TransactionClient,
    user: { id: string; phoneE164?: string | null; googleId?: string | null },
    reason?: string | null,
  ): Promise<number> {
    if (!user?.id || typeof user.id !== 'string' || user.id.trim() === '') {
      throw new Error('user.id is required for addForUser');
    }

    const entriesToCreate: Array<{
      kind: BanBlacklistKind;
      hash: string;
      userId: string;
      reason?: string | null;
    }> = [];

    // 1. Phone hash (if verified phone exists)
    if (user.phoneE164 && user.phoneE164.trim() !== '') {
      entriesToCreate.push({
        kind: BanBlacklistKind.PHONE,
        hash: this.hashPhone(user.phoneE164.trim()),
        userId: user.id,
        reason: reason ?? null,
      });
    }

    // 2. Google hash: check user.googleId or AuthIdentity with provider GOOGLE
    const googleSubs = new Set<string>();
    if (user.googleId && user.googleId.trim() !== '') {
      googleSubs.add(user.googleId.trim());
    }

    const identity = await tx.authIdentity.findFirst({
      where: { userId: user.id, provider: AuthProvider.GOOGLE },
      select: { providerUserId: true },
    });
    if (identity?.providerUserId && identity.providerUserId.trim() !== '') {
      googleSubs.add(identity.providerUserId.trim());
    }

    for (const sub of googleSubs) {
      entriesToCreate.push({
        kind: BanBlacklistKind.GOOGLE,
        hash: this.hashGoogle(sub),
        userId: user.id,
        reason: reason ?? null,
      });
    }

    if (entriesToCreate.length === 0) {
      return 0;
    }

    const result = await tx.banBlacklistEntry.createMany({
      data: entriesToCreate,
      skipDuplicates: true,
    });

    return result.count;
  }

  /**
   * Removes blacklist entries for a user inside an existing Prisma transaction.
   * Only deletes entries belonging to this specific user (userId: user.id).
   * Note: Entries with userId: null (from deleted accounts) are intentionally preserved.
   */
  async removeForUser(
    tx: Prisma.TransactionClient,
    user: { id: string },
  ): Promise<number> {
    if (!user?.id || typeof user.id !== 'string' || user.id.trim() === '') {
      throw new Error('user.id is required for removeForUser');
    }

    const result = await tx.banBlacklistEntry.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return result.count;
  }

  async isPhoneBlocked(phoneE164: string): Promise<boolean> {
    if (!phoneE164 || phoneE164.trim() === '') {
      return false;
    }
    const hash = this.hashPhone(phoneE164.trim());
    const entry = await this.prisma.banBlacklistEntry.findUnique({
      where: {
        kind_hash: {
          kind: BanBlacklistKind.PHONE,
          hash,
        },
      },
      select: { id: true },
    });
    return !!entry;
  }

  async isGoogleBlocked(googleId: string): Promise<boolean> {
    if (!googleId || googleId.trim() === '') {
      return false;
    }
    const hash = this.hashGoogle(googleId.trim());
    const entry = await this.prisma.banBlacklistEntry.findUnique({
      where: {
        kind_hash: {
          kind: BanBlacklistKind.GOOGLE,
          hash,
        },
      },
      select: { id: true },
    });
    return !!entry;
  }

  async isBlocked(identifiers: {
    phoneE164?: string | null;
    googleId?: string | null;
  }): Promise<boolean> {
    if (identifiers.phoneE164 && (await this.isPhoneBlocked(identifiers.phoneE164))) {
      return true;
    }
    if (identifiers.googleId && (await this.isGoogleBlocked(identifiers.googleId))) {
      return true;
    }
    return false;
  }
}
