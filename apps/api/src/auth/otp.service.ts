import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getAuthPepper } from '../config/pepper.config';
import { MAX_VERIFY_ATTEMPTS } from './auth.constants';

export type OtpVerifyResult = 'OK' | 'INVALID' | 'TOO_MANY_ATTEMPTS' | 'MISSING_OR_EXPIRED';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issue a new OTP challenge for a user and purpose.
   * Invalidates any previously active challenge in the same transaction.
   * Returns the raw 6-digit code for delivery (e.g. email) - never persisted in plain text.
   */
  async issue(userId: string, purpose: OtpPurpose, ttlSeconds: number): Promise<string> {
    const code = crypto.randomInt(100000, 1000000).toString();
    const challengeId = crypto.randomUUID();
    const pepper = getAuthPepper();
    const codeHash = crypto
      .createHmac('sha256', pepper)
      .update(`${purpose}:${userId}:${challengeId}:${code}`)
      .digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    await this.prisma.$transaction(async (tx) => {
      // Invalidate all active challenges for this user and purpose
      await tx.otpChallenge.updateMany({
        where: {
          userId,
          purpose,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

      // Insert new challenge
      await tx.otpChallenge.create({
        data: {
          id: challengeId,
          userId,
          purpose,
          codeHash,
          attempts: 0,
          maxAttempts: MAX_VERIFY_ATTEMPTS,
          expiresAt,
        },
      });
    });

    return code;
  }

  /**
   * Verify an OTP challenge.
   * 1. Finds latest unconsumed, unexpired challenge for userId & purpose.
   * 2. Atomically increments attempts if attempts < maxAttempts.
   * 3. Compares HMAC using timingSafeEqual on Buffers.
   * 4. Atomically consumes challenge on success.
   */
  async verify(userId: string, purpose: OtpPurpose, code: string): Promise<OtpVerifyResult> {
    if (!code || typeof code !== 'string') {
      return 'INVALID';
    }

    const now = new Date();
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return 'MISSING_OR_EXPIRED';
    }

    // Atomically increment attempts
    const updateResult = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: challenge.maxAttempts },
      },
      data: {
        attempts: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      return 'TOO_MANY_ATTEMPTS';
    }

    const currentAttempts = challenge.attempts + 1;

    // Timing-safe HMAC hash comparison
    const pepper = getAuthPepper();
    const expectedHash = crypto
      .createHmac('sha256', pepper)
      .update(`${purpose}:${userId}:${challenge.id}:${code}`)
      .digest('hex');

    const bufActual = Buffer.from(challenge.codeHash, 'hex');
    const bufExpected = Buffer.from(expectedHash, 'hex');

    const matches =
      bufActual.length === bufExpected.length &&
      crypto.timingSafeEqual(bufActual, bufExpected);

    if (!matches) {
      if (currentAttempts >= challenge.maxAttempts) {
        return 'TOO_MANY_ATTEMPTS';
      }
      return 'INVALID';
    }

    // Hashes matched: atomically mark as consumed
    const consumeResult = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    if (consumeResult.count === 1) {
      return 'OK';
    }

    // Lost race condition: another concurrent caller consumed it
    return 'INVALID';
  }

  /**
   * Invalidate active challenges for a user (optionally filtered by purpose).
   */
  async invalidateActive(userId: string, purpose?: OtpPurpose, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    const where: any = {
      userId,
      consumedAt: null,
    };
    if (purpose) {
      where.purpose = purpose;
    }
    await client.otpChallenge.updateMany({
      where,
      data: {
        consumedAt: new Date(),
      },
    });
  }

  /**
   * Issue a new OTP challenge for a phone number and purpose.
   * Invalidates any previously active challenge for the same phone & purpose.
   * Can participate in an existing prisma transaction (tx) if provided.
   * Returns the raw 6-digit code for delivery (e.g. WhatsApp) - never persisted in plain text.
   */
  async issueForPhone(
    phoneE164: string,
    purpose: OtpPurpose,
    ttlSeconds: number,
    userId?: string,
    tx?: any,
  ): Promise<string> {
    const code = crypto.randomInt(100000, 1000000).toString();
    const challengeId = crypto.randomUUID();
    const pepper = getAuthPepper();
    const codeHash = crypto
      .createHmac('sha256', pepper)
      .update(`${purpose}:${phoneE164}:${challengeId}:${code}`)
      .digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const execute = async (client: any) => {
      // Invalidate all active challenges for this phone and purpose
      await client.otpChallenge.updateMany({
        where: {
          phoneE164,
          purpose,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

      // Insert new challenge
      await client.otpChallenge.create({
        data: {
          id: challengeId,
          userId: userId || null,
          phoneE164,
          purpose,
          codeHash,
          attempts: 0,
          maxAttempts: MAX_VERIFY_ATTEMPTS,
          expiresAt,
        },
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await this.prisma.$transaction(async (innerTx) => {
        await execute(innerTx);
      });
    }

    return code;
  }

  /**
   * Verify an OTP challenge for a phone number.
   * 1. Finds latest unconsumed, unexpired challenge for phoneE164 & purpose.
   * 2. Atomically increments attempts if attempts < maxAttempts.
   * 3. Compares HMAC using timingSafeEqual on Buffers.
   * 4. Atomically consumes challenge on success.
   */
  async verifyForPhone(
    phoneE164: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<OtpVerifyResult> {
    if (!code || typeof code !== 'string') {
      return 'INVALID';
    }

    const now = new Date();
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneE164,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return 'MISSING_OR_EXPIRED';
    }

    // Atomically increment attempts
    const updateResult = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: challenge.maxAttempts },
      },
      data: {
        attempts: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      return 'TOO_MANY_ATTEMPTS';
    }

    const currentAttempts = challenge.attempts + 1;

    // Timing-safe HMAC hash comparison
    const pepper = getAuthPepper();
    const expectedHash = crypto
      .createHmac('sha256', pepper)
      .update(`${purpose}:${phoneE164}:${challenge.id}:${code}`)
      .digest('hex');

    const bufActual = Buffer.from(challenge.codeHash, 'hex');
    const bufExpected = Buffer.from(expectedHash, 'hex');

    const matches =
      bufActual.length === bufExpected.length &&
      crypto.timingSafeEqual(bufActual, bufExpected);

    if (!matches) {
      if (currentAttempts >= challenge.maxAttempts) {
        return 'TOO_MANY_ATTEMPTS';
      }
      return 'INVALID';
    }

    // Hashes matched: atomically mark as consumed
    const consumeResult = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    if (consumeResult.count === 1) {
      return 'OK';
    }

    // Lost race condition: another concurrent caller consumed it
    return 'INVALID';
  }

  /**
   * Invalidate active challenges for a phone number (optionally filtered by purpose).
   */
  async invalidateActiveForPhone(
    phoneE164: string,
    purpose?: OtpPurpose,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;
    const where: any = {
      phoneE164,
      consumedAt: null,
    };
    if (purpose) {
      where.purpose = purpose;
    }
    await client.otpChallenge.updateMany({
      where,
      data: {
        consumedAt: new Date(),
      },
    });
  }
}
