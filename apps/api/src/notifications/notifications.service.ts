import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PushService } from './push.service';
import { NOTIFICATION_EVENTS } from './notification.events';

/** Retention window for the notification list (findAll only) */
const RETENTION_DAYS = 90;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly pushService: PushService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        userId: dto.userId,
        data: dto.data ? (dto.data as any) : undefined,
      },
    });

    // Fire event — ChatGateway listens and pushes via WebSocket
    const unreadCount = await this.getUnreadCount(dto.userId);
    this.events.emit(NOTIFICATION_EVENTS.CREATED, {
      userId: dto.userId,
      notification,
      unreadCount: unreadCount.count,
    });

    // Send Web Push notification
    try {
      await this.pushService.sendToUser(dto.userId, {
        title: dto.title,
        body: dto.body,
        url: '/notifications',
        data: dto.data,
      });
    } catch (err) {
      this.logger.error('Push notification failed', err instanceof Error ? err.stack : String(err));
    }

    return notification;
  }

  async findAll(userId: string, page = 1, limit = 20, filter?: 'all' | 'unread') {
    const skip = (page - 1) * limit;
    const retentionDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const where = {
      userId,
      createdAt: { gt: retentionDate },
      ...(filter === 'unread' ? { isRead: false } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string) {
    // No retention filter — badge must reflect ALL unread notifications
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) throw new NotFoundException('الإشعار غير موجود');
    if (notification.isRead) return { message: 'تم تحديد الإشعار كمقروء' };

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { message: 'تم تحديد الإشعار كمقروء' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'تم تحديد جميع الإشعارات كمقروءة' };
  }
}
