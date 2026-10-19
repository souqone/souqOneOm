import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountStatus } from '@prisma/client';
import validator from 'validator';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import {
  USER_STATUS_CHANGED,
  UserStatusChangedPayload,
} from '../events/user-status.events';
import { maskEmailSafe, redactEmails } from '../utils/mask-email';

@Injectable()
export class UserStatusEmailListener {
  private readonly logger = new Logger(UserStatusEmailListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @OnEvent(USER_STATUS_CHANGED, { async: true })
  async handleUserStatusChanged(
    payload: UserStatusChangedPayload,
  ): Promise<void> {
    try {
      if (!payload || !payload.userId) {
        return;
      }

      // No status change occurred (same before and after)
      if (payload.previousStatus === payload.status) {
        this.logger.debug(
          `UserStatusEmailListener: status unchanged (${payload.status}) for user ${payload.userId} — skipping`,
        );
        return;
      }

      // Only send emails for SUSPENDED and BANNED statuses
      if (
        payload.status !== AccountStatus.SUSPENDED &&
        payload.status !== AccountStatus.BANNED
      ) {
        this.logger.debug(
          `UserStatusEmailListener: status ${payload.status} is not eligible for notification email for user ${payload.userId} — skipping`,
        );
        return;
      }

      // Fetch user record with narrow select
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          email: true,
          displayName: true,
          status: true,
          suspendedUntil: true,
        },
      });

      if (!user) {
        this.logger.debug(
          `UserStatusEmailListener: user ${payload.userId} not found in database — skipping status email`,
        );
        return;
      }

      // Skip phone-only users with no email
      if (!user.email) {
        this.logger.debug(
          `UserStatusEmailListener: user ${payload.userId} has no email address (phone-only) — skipping status email`,
        );
        return;
      }

      const trimmedEmail = user.email.trim();

      // Skip anonymized emails (e.g. from account-deletion job) or invalid email format
      if (
        trimmedEmail === '[DELETED]' ||
        trimmedEmail.startsWith('[DELETED]') ||
        trimmedEmail.toLowerCase().startsWith('deleted_') ||
        !validator.isEmail(trimmedEmail)
      ) {
        this.logger.debug(
          `UserStatusEmailListener: user ${payload.userId} has anonymized or invalid email address — skipping status email`,
        );
        return;
      }

      // Skip users that have transitioned to DELETED status
      if (user.status === AccountStatus.DELETED) {
        this.logger.debug(
          `UserStatusEmailListener: user ${payload.userId} is in DELETED status — skipping status email`,
        );
        return;
      }

      // Skip stale events where current database status does not match payload status
      if (user.status !== payload.status) {
        this.logger.debug(
          `UserStatusEmailListener: user ${payload.userId} current DB status (${user.status}) does not match payload status (${payload.status}) — skipping stale event`,
        );
        return;
      }

      if (payload.status === AccountStatus.SUSPENDED) {
        const effectiveSuspendedUntil =
          payload.suspendedUntil ?? user.suspendedUntil ?? null;
        await this.mailService.sendAccountSuspendedEmail(
          user.email,
          effectiveSuspendedUntil,
          user.displayName,
        );
        this.logger.log(
          `Sent account suspended email to ${maskEmailSafe(user.email)} for user ${payload.userId}`,
        );
      } else if (payload.status === AccountStatus.BANNED) {
        await this.mailService.sendAccountBannedEmail(
          user.email,
          user.displayName,
        );
        this.logger.log(
          `Sent account banned email to ${maskEmailSafe(user.email)} for user ${payload.userId}`,
        );
      }
    } catch (err: any) {
      // Must never throw or crash the event emitter loop
      const sanitizedMsg = redactEmails(err?.message || String(err));
      this.logger.error(
        `Error handling ${USER_STATUS_CHANGED} status email for user ${payload?.userId}: ${sanitizedMsg}`,
        err?.stack ? redactEmails(err.stack) : undefined,
      );
    }
  }
}
