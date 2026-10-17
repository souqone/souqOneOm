import {
  Controller,
  Get,
  Post,
  Query,
  Headers,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { WhatsappMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Compares two secrets in constant time by hashing both with SHA-256 first.
 * This guarantees that:
 * 1. String lengths are never leaked.
 * 2. crypto.timingSafeEqual never throws length mismatch exceptions.
 * 3. Empty or undefined inputs safely return false.
 */
export function safeSecretCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = crypto.createHash('sha256').update(a).digest();
  const bufB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

const STATUS_RANKS: Record<WhatsappMessageStatus, number> = {
  ACCEPTED: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4,
  FAILED: 99,
};

@SkipThrottle()
@Controller('whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Meta Webhook Verification Handshake (GET).
   * Verifies hub.mode and hub.verify_token in constant time and echoes hub.challenge.
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
    @Res() res?: Response,
  ): any {
    const configuredToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (
      mode === 'subscribe' &&
      safeSecretCompare(token, configuredToken) &&
      challenge
    ) {
      this.logger.log('WhatsApp webhook handshake verified successfully');
      if (res) {
        return res.status(HttpStatus.OK).send(challenge);
      }
      return challenge;
    }

    this.logger.warn('WhatsApp webhook handshake verification failed');
    throw new ForbiddenException('Webhook verification token mismatch');
  }

  /**
   * Meta Webhook Status Event Receiver (POST).
   * Validates X-Hub-Signature-256 header over rawBody in constant time.
   * Monotonically transitions message status (ACCEPTED < SENT < DELIVERED < READ, FAILED always).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Headers('x-hub-signature-256') signatureHeader?: string,
  ): Promise<{ status: string }> {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret || appSecret.trim() === '') {
      this.logger.warn('WhatsApp webhook rejected: WHATSAPP_APP_SECRET is not configured');
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    const rawBody: Buffer | undefined = req.rawBody;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      this.logger.warn('WhatsApp webhook rejected: missing rawBody buffer');
      throw new UnauthorizedException('Missing raw body for webhook verification');
    }

    if (!signatureHeader || typeof signatureHeader !== 'string') {
      this.logger.warn('WhatsApp webhook rejected: missing X-Hub-Signature-256 header');
      throw new UnauthorizedException('Missing X-Hub-Signature-256 header');
    }

    // Expected signature: sha256=<hex_hmac>
    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (!safeSecretCompare(signatureHeader, expectedSignature)) {
      this.logger.warn('WhatsApp webhook rejected: invalid X-Hub-Signature-256');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Parse payload
    let payload: any;
    try {
      payload =
        typeof req.body === 'object' && req.body !== null
          ? req.body
          : JSON.parse(rawBody.toString('utf8'));
    } catch {
      return { status: 'ok' };
    }

    // Extract statuses from payload
    const entries = payload?.entry;
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const changes = entry?.changes;
        if (Array.isArray(changes)) {
          for (const change of changes) {
            const statuses = change?.value?.statuses;
            if (Array.isArray(statuses)) {
              for (const statusObj of statuses) {
                await this.processStatusUpdate(statusObj);
              }
            }
          }
        }
      }
    }

    return { status: 'ok' };
  }

  private async processStatusUpdate(statusObj: any): Promise<void> {
    const providerMessageId = statusObj?.id;
    const rawStatus = (statusObj?.status || '').toString().toLowerCase();

    if (!providerMessageId || typeof providerMessageId !== 'string') {
      return;
    }

    let targetStatus: WhatsappMessageStatus | null = null;
    if (rawStatus === 'sent') targetStatus = 'SENT';
    else if (rawStatus === 'delivered') targetStatus = 'DELIVERED';
    else if (rawStatus === 'read') targetStatus = 'READ';
    else if (rawStatus === 'failed') targetStatus = 'FAILED';

    if (!targetStatus) {
      return;
    }

    const existing = await this.prisma.whatsappMessageLog.findUnique({
      where: { providerMessageId },
    });

    if (!existing) {
      // Message ID not recognized, ignore gracefully
      return;
    }

    // Monotonic transition rule:
    // FAILED is always applied.
    // For others, only update if targetStatus rank is strictly greater than existing status rank.
    if (targetStatus !== 'FAILED') {
      const currentRank = STATUS_RANKS[existing.status] || 0;
      const targetRank = STATUS_RANKS[targetStatus] || 0;

      if (targetRank <= currentRank) {
        // State is already at or past this stage (e.g. READ arrived before DELIVERED), ignore
        return;
      }
    }

    const errorCode =
      targetStatus === 'FAILED'
        ? statusObj?.errors?.[0]?.code
          ? String(statusObj.errors[0].code)
          : existing.errorCode || 'DELIVERY_FAILED'
        : existing.errorCode;

    await this.prisma.whatsappMessageLog.update({
      where: { id: existing.id },
      data: {
        status: targetStatus,
        errorCode,
      },
    });
  }
}
