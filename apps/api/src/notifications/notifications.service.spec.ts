import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';
import { ExpoPushService } from './expo-push.service';
import { NOTIFICATION_EVENTS } from './notification.events';

describe('NotificationsService (D-344 self-action guard)', () => {
  let service: NotificationsService;
  let prisma: { notification: { create: jest.Mock; count: jest.Mock } };
  let events: { emit: jest.Mock };
  let pushService: { sendToUser: jest.Mock };
  let expoPushService: { sendToUser: jest.Mock };

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'notif-1',
          ...data,
          createdAt: new Date(),
        })),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    events = { emit: jest.fn() };
    pushService = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    expoPushService = { sendToUser: jest.fn().mockResolvedValue(undefined) };

    service = new NotificationsService(
      prisma as unknown as PrismaService,
      events as unknown as EventEmitter2,
      pushService as unknown as PushService,
      expoPushService as unknown as ExpoPushService,
    );
  });

  it('returns null and skips prisma/event/push/expo when actorId equals userId', async () => {
    const result = await service.create({
      type: NotificationType.LISTING_UPDATED,
      title: 'تم تحديث إعلانك',
      body: 'body',
      userId: 'user-1',
      actorId: 'user-1',
      data: { listingId: 'l-1' },
    });

    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.notification.count).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
    expect(pushService.sendToUser).not.toHaveBeenCalled();
    expect(expoPushService.sendToUser).not.toHaveBeenCalled();
  });

  it('creates notification and fires event/push/expo when actorId differs from userId', async () => {
    const result = await service.create({
      type: NotificationType.LISTING_DELETED,
      title: 'تم حذف إعلانك',
      body: 'body',
      userId: 'user-1',
      actorId: 'admin-99',
      data: { listingId: 'l-1' },
    });

    expect(result).not.toBeNull();
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    const createPayload = prisma.notification.create.mock.calls[0][0].data;
    expect(createPayload).not.toHaveProperty('actorId');
    expect(events.emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENTS.CREATED,
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(pushService.sendToUser).toHaveBeenCalledTimes(1);
    expect(expoPushService.sendToUser).toHaveBeenCalledTimes(1);
  });

  it('creates notification (fail-open) when actorId is absent', async () => {
    const result = await service.create({
      type: NotificationType.SYSTEM,
      title: 'إشعار نظام',
      body: 'body',
      userId: 'user-1',
    });

    expect(result).not.toBeNull();
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(pushService.sendToUser).toHaveBeenCalledTimes(1);
    expect(expoPushService.sendToUser).toHaveBeenCalledTimes(1);
  });

  it.each<[NotificationType, string | undefined]>([
    [NotificationType.REVIEW_REMINDER, undefined],
    [NotificationType.TRANSPORT_BOOKING_CONFIRMED, undefined],
    [NotificationType.PAYMENT_SUCCESS, undefined],
    [NotificationType.SUBSCRIPTION_ACTIVATED, undefined],
    [NotificationType.FEATURED_EXPIRED, undefined],
    [NotificationType.SYSTEM, undefined],
    [NotificationType.MESSAGE, 'sender-2'],
    [NotificationType.LISTING_FAVORITED, 'liker-2'],
    [NotificationType.REVIEW_RECEIVED, 'reviewer-2'],
    [NotificationType.OPERATOR_DELETION_APPROVED, 'admin-1'],
    [NotificationType.OPERATOR_DELETION_REJECTED, 'admin-1'],
  ])('delivers %s notification when actorId=%s != userId', async (type, actorId) => {
    const result = await service.create({
      type,
      title: 'إشعار',
      body: 'تفاصيل',
      userId: 'recipient-1',
      ...(actorId ? { actorId } : {}),
    });

    expect(result).not.toBeNull();
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });
});
