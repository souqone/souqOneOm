import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  BRAND_NAME,
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildDeletionRequestEmail,
  buildDeletionCancelledEmail,
  buildFinalDeletionEmail,
  EmailTemplateResult,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly fromName = BRAND_NAME;
  private readonly replyTo: string;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = parseInt(process.env.MAIL_PORT || '465', 10);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;
    this.fromAddress = process.env.MAIL_FROM || 'noreply@mail.souqoneom.com';
    this.replyTo = process.env.MAIL_REPLY_TO || 'support@souqoneom.com';

    if (!host || !user || !pass) {
      this.logger.warn('MAIL_HOST/MAIL_USER/MAIL_PASS not set — emails will be logged but not sent');
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mail transporter configured → ${host}:${port} as ${user}`);
    }
  }

  private async send(to: string, { subject, html, text }: EmailTemplateResult): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[DEV] Email to ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        replyTo: this.replyTo,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent to ${to} | Subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const template = buildVerificationEmail({ code });
    await this.send(to, template);
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const template = buildPasswordResetEmail({ code });
    await this.send(to, template);
  }

  /**
   * Sends 5-day grace period account deletion request confirmation email.
   * Fail-safe: Any sending failure is logged as a warning and does NOT throw.
   */
  async sendDeletionRequestEmail(
    to: string,
    scheduledAt: Date,
    displayName?: string | null,
  ): Promise<void> {
    try {
      const template = buildDeletionRequestEmail({ displayName, scheduledAt });
      await this.send(to, template);
    } catch (error) {
      this.logger.warn(`Failed to send deletion request email to ${to}: ${(error as Error)?.message || error}`);
    }
  }

  /**
   * Sends deletion request cancellation confirmation email.
   * Fail-safe: Any sending failure is logged as a warning and does NOT throw.
   */
  async sendDeletionCancelledEmail(
    to: string,
    displayName?: string | null,
  ): Promise<void> {
    try {
      const template = buildDeletionCancelledEmail({ displayName });
      await this.send(to, template);
    } catch (error) {
      this.logger.warn(`Failed to send deletion cancellation email to ${to}: ${(error as Error)?.message || error}`);
    }
  }

  /**
   * Sends final account deletion notice email.
   * Fail-safe: Any sending failure is logged as a warning and does NOT throw.
   */
  async sendFinalDeletionEmail(
    to: string,
    displayName?: string | null,
  ): Promise<void> {
    try {
      const template = buildFinalDeletionEmail({ displayName });
      await this.send(to, template);
    } catch (error) {
      this.logger.warn(`Failed to send final deletion email to ${to}: ${(error as Error)?.message || error}`);
    }
  }
}

