import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  EmailTemplateResult,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly fromName = 'سوق ون';
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
}

