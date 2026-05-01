import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

const ENTITY_LABELS: Record<string, string> = {
  CAR: 'سيارة',
  BUS: 'باص',
  EQUIPMENT: 'معدة',
  TRANSPORT: 'خدمة نقل',
};

@Injectable()
export class BookingNotificationService {
  constructor(private readonly notifications: NotificationsService) {}

  async notifyBookingRequest(ownerId: string, bookingId: string, entityType: string, entityId: string, entityTitle: string) {
    const label = ENTITY_LABELS[entityType] || 'إعلان';
    await this.notifications.create({
      type: 'BOOKING_REQUEST',
      title: 'طلب حجز جديد',
      body: `لديك طلب حجز جديد لـ${label} ${entityTitle}`,
      userId: ownerId,
      data: { bookingId, entityType, entityId },
    });
  }

  async notifyStatusChange(
    status: string,
    bookingId: string,
    entityType: string,
    entityTitle: string,
    renterId: string,
    ownerId: string,
    isRenter: boolean,
  ) {
    const label = ENTITY_LABELS[entityType] || 'إعلان';
    const notifMap: Record<string, { type: string; title: string; body: string; to: string }> = {
      CONFIRMED: { type: 'BOOKING_CONFIRMED', title: 'تم تأكيد حجزك', body: `تم تأكيد حجزك لـ${label} ${entityTitle}`, to: renterId },
      REJECTED: { type: 'BOOKING_REJECTED', title: 'تم رفض الحجز', body: `تم رفض حجزك لـ${label} ${entityTitle}`, to: renterId },
      CANCELLED: { type: 'BOOKING_CANCELLED', title: 'تم إلغاء الحجز', body: `تم إلغاء الحجز لـ${label} ${entityTitle}`, to: isRenter ? ownerId : renterId },
      COMPLETED: { type: 'BOOKING_COMPLETED', title: 'تم إكمال الحجز', body: `تم إكمال حجز ${label} ${entityTitle}`, to: renterId },
    };

    const notif = notifMap[status];
    if (!notif) return;

    await this.notifications.create({
      type: notif.type as any,
      title: notif.title,
      body: notif.body,
      userId: notif.to,
      data: { bookingId, entityType },
    });
  }
}
