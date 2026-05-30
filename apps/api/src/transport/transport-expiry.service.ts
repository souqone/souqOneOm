import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransportExpiryService {
  private readonly logger = new Logger(TransportExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireOldRequests() {
    const expiredRequests = await this.prisma.transportRequest.findMany({
      where: {
        status: { in: ['OPEN', 'QUOTED'] },
        expiresAt: { lt: new Date() },
      },
      select: {
        id: true, userId: true,
        cargoDescription: true, fromGovernorate: true, toGovernorate: true,
        quotes: { where: { status: 'PENDING' }, select: { carrier: { select: { userId: true } } } },
      },
    });

    if (expiredRequests.length === 0) return;

    await this.prisma.transportRequest.updateMany({
      where: { id: { in: expiredRequests.map((r) => r.id) } },
      data: { status: 'EXPIRED' },
    });

    // Flush stale cache entries so the next read reflects EXPIRED status.
    // List cache covers the browse page; detail caches cover individual pages.
    const cacheInvalidations: Promise<unknown>[] = [
      this.redis.delPattern('transport:list:*'),
    ];
    for (const r of expiredRequests) {
      cacheInvalidations.push(this.redis.del(`transport:request:${r.id}`));
      cacheInvalidations.push(this.redis.del(`transport:request:${r.id}:auth`));
    }
    await Promise.allSettled(cacheInvalidations);

    const notifications = expiredRequests.flatMap((r) => {
      const body = `طلب نقل "${r.cargoDescription}" من ${r.fromGovernorate} إلى ${r.toGovernorate} انتهت صلاحيته ولم يُقبل أي عرض`;

      // Notify shipper
      const shipperNotif = this.notifications.create({
        type: 'TRANSPORT_REQUEST_EXPIRED',
        title: 'انتهاء طلب نقل',
        body,
        userId: r.userId,
        data: { requestId: r.id },
      });

      // Notify each carrier with a PENDING quote — their offer is now void
      const carrierNotifs = (r.quotes ?? []).map((q: any) =>
        this.notifications.create({
          type: 'TRANSPORT_REQUEST_CANCELLED',
          title: 'انتهت صلاحية الطلب',
          body: `انتهت صلاحية طلب النقل الذي قدّمت عليه عرضاً — "${r.cargoDescription}"`,
          userId: q.carrier.userId,
          data: { requestId: r.id },
        }),
      );

      return [shipperNotif, ...carrierNotifs];
    });
    await Promise.allSettled(notifications);

    this.logger.log(`Expired ${expiredRequests.length} transport requests`);
  }
}
