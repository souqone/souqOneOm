import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;

  constructor(private readonly prisma: PrismaService) {
    this.expo = new Expo();
  }

  /**
   * Register or refresh a device's Expo push token for a user.
   * Called from POST /users/push-token (Spec 4).
   */
  async registerToken(userId: string, token: string, deviceType?: string) {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Rejected invalid Expo push token: ${token}`);
      throw new Error('Invalid Expo push token format');
    }

    await this.prisma.pushToken.upsert({
      where: { token },
      create: { token, userId, deviceType },
      update: { userId, deviceType, lastUsedAt: new Date() },
    });
  }

  /**
   * Send a push notification to every registered device for a user.
   * Called internally by NotificationsService.create() (Spec 5) —
   * feature modules never call this directly.
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, any> },
  ) {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        priority: 'high',
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        this.logger.error(
          'Expo push send failed for a chunk',
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    await this.handleTickets(tickets, messages);
  }

  /**
   * Inspect send tickets for immediate errors (e.g. DeviceNotRegistered)
   * and clean up dead tokens right away. Expo's receipt-based cleanup
   * (checking hours later) is intentionally NOT implemented in this
   * phase — ticket-level errors cover the common case (uninstalled app,
   * malformed token) well enough for v1.
   */
  private async handleTickets(tickets: ExpoPushTicket[], messages: ExpoPushMessage[]) {
    const deadTokens: string[] = [];

    tickets.forEach((ticket, i) => {
      if (ticket.status === 'error') {
        const errorCode = ticket.details?.error;
        this.logger.warn(`Expo push ticket error: ${errorCode} for token ${messages[i]?.to}`);
        if (errorCode === 'DeviceNotRegistered') {
          const token = messages[i]?.to;
          if (typeof token === 'string') deadTokens.push(token);
        }
      }
    });

    if (deadTokens.length > 0) {
      await this.prisma.pushToken.deleteMany({
        where: { token: { in: deadTokens } },
      });
      this.logger.log(`Cleaned up ${deadTokens.length} dead Expo push token(s)`);
    }
  }
}
