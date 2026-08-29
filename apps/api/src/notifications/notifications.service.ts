import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PushService } from './push.service';
import { ExpoPushService } from './expo-push.service';
import { NOTIFICATION_EVENTS } from './notification.events';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

/** Retention window for the notification list (findAll only) */
const RETENTION_DAYS = 90;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly pushService: PushService,
    private readonly expoPushService: ExpoPushService,
  ) {}

  async create(dto: CreateNotificationDto) {
    // Normalize data for mobile deep-linking — keeps original fields intact
    const normalizedData = this.normalizeNotificationData(dto.type, dto.data);

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        userId: dto.userId,
        data: normalizedData ? (normalizedData as any) : undefined,
      },
    });

    // Fire event — ChatGateway listens and pushes via WebSocket
    const unreadCount = await this.getUnreadCount(dto.userId);
    this.events.emit(NOTIFICATION_EVENTS.CREATED, {
      userId: dto.userId,
      notification,
      unreadCount: unreadCount.count,
    });

    // Send Web Push notification — deep-link to the relevant page
    try {
      await this.pushService.sendToUser(dto.userId, {
        title: dto.title,
        body: dto.body,
        url: this.resolveNavigationUrl(dto.type, normalizedData),
        data: normalizedData,
      });
    } catch (err) {
      this.logger.error('Push notification failed', err instanceof Error ? err.stack : String(err));
    }

    // Send Expo Push notification — delivers to mobile devices
    try {
      await this.expoPushService.sendToUser(dto.userId, {
        title: dto.title,
        body: dto.body,
        data: normalizedData,
      });
    } catch (err) {
      this.logger.error(
        'Expo push notification failed',
        err instanceof Error ? err.stack : String(err),
      );
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
    // Apply the same 90-day retention so badge count matches what's visible in the list
    const retentionDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false, createdAt: { gt: retentionDate } },
    });
    return { count };
  }

  async deleteOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('الإشعار غير موجود');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'تم حذف الإشعار' };
  }

  async deleteAllRead(userId: string) {
    const retentionDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true, createdAt: { gt: retentionDate } },
    });
    return { message: 'تم حذف الإشعارات المقروءة', count };
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

  /**
   * Best-effort normalization for mobile deep-linking.
   * Keeps all existing fields intact and ADDS entityType/entityId if they
   * can be inferred — so mobile clients can deep-link without knowing
   * every possible data shape per module.
   */
  private normalizeNotificationData(_type: string, data?: Record<string, any>) {
    if (!data) return data;
    if (data.entityType && data.entityId) return data; // already normalized

    const inferred: Record<string, any> = { ...data };

    if (data.jobId && !data.applicationId) {
      inferred.entityType = ENTITY_TYPES.JOB;
      inferred.entityId = data.jobId;
    } else if (data.applicationId) {
      inferred.entityType = ENTITY_TYPES.JOB_APPLICATION;
      inferred.entityId = data.applicationId;
    } else if (data.requestId) {
      inferred.entityType = ENTITY_TYPES.TRANSPORT_REQUEST;
      inferred.entityId = data.requestId;
    } else if (data.bookingId) {
      inferred.entityType = ENTITY_TYPES.TRANSPORT_BOOKING;
      inferred.entityId = data.bookingId;
    } else if (data.listingId) {
      inferred.entityType = data.entityType ?? ENTITY_TYPES.LISTING;
      inferred.entityId = data.listingId;
    }

    return inferred;
  }

  /**
   * Server-side deep-link resolver — mirrors the frontend NOTIFICATION_TYPE_CONFIG.
   * Used to set the `url` field in Web Push payloads so tapping a push notification
   * opens the relevant page directly instead of always landing on /notifications.
   */
  private resolveNavigationUrl(type: string, data?: Record<string, unknown>): string {
    const d = data as any;
    switch (type as NotificationType) {
      case NotificationType.MESSAGE:
        return d?.conversationId ? `/messages/${d.conversationId}` : '/messages';

      case NotificationType.LISTING_SOLD:
      case NotificationType.LISTING_FAVORITED:
        if (d?.entityType === ENTITY_TYPES.BUS_LISTING)        return d?.entityId ? `/buses/${d.entityId}`       : '/buses';
        if (d?.entityType === ENTITY_TYPES.EQUIPMENT_LISTING)  return d?.entityId ? `/equipment/${d.entityId}`   : '/equipment';
        return d?.entityId ? `/sale/car/${d.entityId}` : '/profile';

      case NotificationType.PRICE_DROP:
        return d?.listingId ? `/sale/car/${d.listingId}` : '/cars';

      case NotificationType.TRANSPORT_QUOTE_RECEIVED:
        return d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-requests';

      case NotificationType.TRANSPORT_QUOTE_ACCEPTED:
        return d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-bookings';

      case NotificationType.TRANSPORT_BOOKING_CONFIRMED:
        // Booking-created notification includes conversationId — go there directly
        if (d?.conversationId) return `/messages/${d.conversationId}`;
        return d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-bookings';

      case NotificationType.TRANSPORT_BOOKING_STARTED:
      case NotificationType.TRANSPORT_BOOKING_COMPLETED:
      case NotificationType.TRANSPORT_BOOKING_CANCELLED:
      case NotificationType.TRANSPORT_REQUEST_CLOSED:
        return d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-bookings';

      case NotificationType.TRANSPORT_QUOTE_WITHDRAWN:
      case NotificationType.TRANSPORT_QUOTE_REJECTED:
      case NotificationType.TRANSPORT_REQUEST_CANCELLED:
      case NotificationType.TRANSPORT_REQUEST_EXPIRED:
        return d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-requests';

      case NotificationType.TRANSPORT_REQUEST_NEW:
        return d?.requestId ? `/transport/requests/${d.requestId}` : '/transport';

      case NotificationType.TRANSPORT_REQUEST_UPDATED:
        return d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-quotes';

      case NotificationType.REVIEW_REMINDER:
        return d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-bookings';

      case NotificationType.JOB_APPLICATION:
      case NotificationType.JOB_APPLICATION_ACCEPTED:
      case NotificationType.JOB_APPLICATION_REJECTED:
      case NotificationType.JOB_APPLICATION_WITHDRAWN:
      case NotificationType.JOB_RECOMMENDATION:
        return d?.jobId ? `/jobs/${d.jobId}` : '/jobs';

      case NotificationType.REVIEW_RECEIVED:
        return d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/notifications';

      case NotificationType.FEATURED_EXPIRED: {
        if (!d?.listingId) return '/profile';
        if (d.listingType === 'bus')       return `/buses/${d.listingId}`;
        if (d.listingType === 'equipment') return `/equipment/${d.listingId}`;
        return `/sale/car/${d.listingId}`;
      }

      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.SUBSCRIPTION_ACTIVATED:
        return '/profile';

      case NotificationType.LISTING_CREATED:
      case NotificationType.LISTING_UPDATED:
      case NotificationType.LISTING_DELETED:
      case NotificationType.LISTING_STATUS_CHANGED:
        return d?.listingId ? `/sale/car/${d.listingId}` : '/profile';

      case NotificationType.SYSTEM:
        // Allow callers to pass a specific URL via data.url
        return (d?.url as string) || '/notifications';

      default:
        return '/notifications';
    }
  }
}
