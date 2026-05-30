import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../notifications/notifications.service';
import { LISTING_EVENTS, ListingEventPayload } from '../events/listing.events';

const ENTITY_LABELS: Record<string, string> = {
  LISTING:            'سيارة',
  BUS_LISTING:        'حافلة',
  EQUIPMENT_LISTING:  'معدات',
  OPERATOR_LISTING:   'مشغّل',
  SPARE_PART:         'قطعة غيار',
  CAR_SERVICE:        'خدمة سيارات',
  JOB:                'وظيفة',
};

@Injectable()
export class ListingNotificationListener {
  private readonly logger = new Logger(ListingNotificationListener.name);

  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent(LISTING_EVENTS.CREATED)
  async onListingCreated(payload: ListingEventPayload) {
    const label = ENTITY_LABELS[payload.entityType] ?? 'إعلان';
    await this.notify(payload.userId, 'LISTING_CREATED',
      `تم نشر ${label} بنجاح ✅`,
      `إعلانك "${payload.title}" أصبح مرئياً للجميع الآن.`,
      payload,
    );
  }

  @OnEvent(LISTING_EVENTS.UPDATED)
  async onListingUpdated(payload: ListingEventPayload) {
    const label = ENTITY_LABELS[payload.entityType] ?? 'إعلان';
    await this.notify(payload.userId, 'LISTING_UPDATED',
      `تم تحديث ${label}`,
      `تم تحديث إعلانك "${payload.title}" بنجاح.`,
      payload,
    );
  }

  @OnEvent(LISTING_EVENTS.DELETED)
  async onListingDeleted(payload: ListingEventPayload) {
    const label = ENTITY_LABELS[payload.entityType] ?? 'إعلان';
    await this.notify(payload.userId, 'LISTING_DELETED',
      `تم حذف ${label}`,
      `تم حذف إعلانك "${payload.title}".`,
      payload,
    );
  }

  @OnEvent(LISTING_EVENTS.STATUS_CHANGED)
  async onListingStatusChanged(payload: ListingEventPayload) {
    const label = ENTITY_LABELS[payload.entityType] ?? 'إعلان';

    // Use the dedicated LISTING_SOLD type when a listing is marked as sold
    if (payload.status === 'SOLD') {
      await this.notify(payload.userId, 'LISTING_SOLD',
        `تم بيع ${label} 🎉`,
        `تهانينا! إعلانك "${payload.title}" تم تحديده كمباع.`,
        payload,
      );
      return;
    }

    const statusAr = payload.status === 'ACTIVE' ? 'مفعّل' : 'معطّل';
    await this.notify(payload.userId, 'LISTING_STATUS_CHANGED',
      `تم تغيير حالة ${label}`,
      `إعلانك "${payload.title}" الآن ${statusAr}.`,
      payload,
    );
  }

  private async notify(
    userId: string,
    type: string,
    title: string,
    body: string,
    payload: ListingEventPayload,
  ) {
    try {
      await this.notifications.create({
        type: type as any,
        title,
        body,
        userId,
        data: {
          entityType: payload.entityType,
          listingId: payload.listingId,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to send ${type} notification`, err);
    }
  }
}
