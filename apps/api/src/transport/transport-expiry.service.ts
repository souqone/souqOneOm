import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransportExpiryService {
  private readonly logger = new Logger(TransportExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireOldRequests() {
    const expiredRequests = await this.prisma.transportRequest.findMany({
      where: {
        status: { in: ['OPEN', 'QUOTED'] },
        expiresAt: { lt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (expiredRequests.length > 0) {
      await this.prisma.transportRequest.updateMany({
        where: { id: { in: expiredRequests.map((r) => r.id) } },
        data: { status: 'EXPIRED' },
      });

      const notifications = expiredRequests.map((r) =>
        this.notifications.create({
          type: 'TRANSPORT_REQUEST_EXPIRED',
          title: 'انتهاء طلب نقل',
          body: 'انتهت صلاحية طلب النقل الخاص بك ولم يتم قبول أي عرض',
          userId: r.userId,
          data: { requestId: r.id },
        }),
      );
      await Promise.allSettled(notifications);

      this.logger.log(`Expired ${expiredRequests.length} transport requests`);
    }
  }
}
