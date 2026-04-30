import { Injectable, Logger } from '@nestjs/common';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidPublicKey: string;
  private enabled: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@souqone.com';
    this.vapidPublicKey = publicKey;

    let valid = !!(publicKey && privateKey);

    if (valid) {
      try {
        webPush.setVapidDetails(subject, publicKey, privateKey);
        this.logger.log('Web Push (VAPID) configured');
      } catch (err: any) {
        valid = false;
        this.logger.warn(`VAPID keys invalid — push notifications disabled: ${err?.message || ''}`);
      }
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }

    this.enabled = valid;
  }

  getPublicKey(): string {
    if (!this.vapidPublicKey) {
      this.logger.warn('VAPID public key requested but not configured');
    }
    return this.vapidPublicKey;
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
      },
    });

    return { success: true };
  }

  async unsubscribe(endpoint: string, userId: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
    return { success: true };
  }

  async sendToUser(userId: string, payload: { title: string; body: string; icon?: string; url?: string; data?: any }) {
    if (!this.enabled) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subs.length === 0) return;

    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: payload.url || '/',
      data: payload.data,
    });

    const results = await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          jsonPayload,
        ),
      ),
    );

    // Clean up expired/invalid subscriptions
    const expiredEndpoints: string[] = [];
    results.forEach((result: PromiseSettledResult<unknown>, i: number) => {
      if (result.status === 'rejected') {
        const statusCode = ((result as PromiseRejectedResult).reason as any)?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(subs[i].endpoint);
        }
        this.logger.warn(`Push failed for ${subs[i].endpoint}: ${(result as PromiseRejectedResult).reason}`);
      }
    });

    if (expiredEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
    }
  }
}
