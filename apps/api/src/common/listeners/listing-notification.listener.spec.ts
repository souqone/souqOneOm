import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingNotificationListener } from './listing-notification.listener';
import { NotificationsService } from '../../notifications/notifications.service';
import { LISTING_EVENTS, ListingEventPayload } from '../events/listing.events';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from '../../notifications/push.service';
import { ExpoPushService } from '../../notifications/expo-push.service';

describe('ListingNotificationListener (D-344 table-driven)', () => {
  let listener: ListingNotificationListener;
  let prisma: { notification: { create: jest.Mock; count: jest.Mock } };
  let events: { emit: jest.Mock };
  let pushService: { sendToUser: jest.Mock };
  let expoPushService: { sendToUser: jest.Mock };
  let notificationsService: NotificationsService;
  let createSpy: jest.SpyInstance;

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

    notificationsService = new NotificationsService(
      prisma as unknown as PrismaService,
      events as unknown as EventEmitter2,
      pushService as unknown as PushService,
      expoPushService as unknown as ExpoPushService,
    );
    createSpy = jest.spyOn(notificationsService, 'create');
    listener = new ListingNotificationListener(notificationsService);
  });

  type EventCase = {
    label: string;
    invoke: (l: ListingNotificationListener, p: ListingEventPayload) => Promise<void>;
    status?: string;
    expectedType: string;
  };

  const eventCases: EventCase[] = [
    {
      label: LISTING_EVENTS.CREATED,
      invoke: (l, p) => l.onListingCreated(p),
      expectedType: 'LISTING_CREATED',
    },
    {
      label: LISTING_EVENTS.UPDATED,
      invoke: (l, p) => l.onListingUpdated(p),
      expectedType: 'LISTING_UPDATED',
    },
    {
      label: LISTING_EVENTS.DELETED,
      invoke: (l, p) => l.onListingDeleted(p),
      expectedType: 'LISTING_DELETED',
    },
    {
      label: `${LISTING_EVENTS.STATUS_CHANGED} (ACTIVE)`,
      invoke: (l, p) => l.onListingStatusChanged(p),
      status: 'ACTIVE',
      expectedType: 'LISTING_STATUS_CHANGED',
    },
    {
      label: `${LISTING_EVENTS.STATUS_CHANGED} (SOLD)`,
      invoke: (l, p) => l.onListingStatusChanged(p),
      status: 'SOLD',
      expectedType: 'LISTING_SOLD',
    },
  ];

  const actorCases: Array<{
    actorLabel: string;
    actorId: string | undefined;
    expectPersisted: boolean;
  }> = [
    { actorLabel: 'owner (self-action)', actorId: 'owner-1', expectPersisted: false },
    { actorLabel: 'other actor (admin/moderator)', actorId: 'admin-9', expectPersisted: true },
    { actorLabel: 'no actor (fail-open)', actorId: undefined, expectPersisted: true },
  ];

  const matrix = eventCases.flatMap((ev) =>
    actorCases.map((ac) => ({ ...ev, ...ac })),
  );

  it.each(matrix)(
    '$label x $actorLabel -> persisted=$expectPersisted',
    async ({ invoke, status, expectedType, actorId, expectPersisted }) => {
      const payload: ListingEventPayload = {
        entityType: 'LISTING',
        listingId: 'listing-1',
        title: 'تويوتا كامري 2024',
        userId: 'owner-1',
        status,
        ...(actorId !== undefined ? { actorId } : {}),
      };

      await invoke(listener, payload);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expectedType,
          userId: 'owner-1',
          actorId,
        }),
      );

      if (expectPersisted) {
        expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      } else {
        expect(prisma.notification.create).not.toHaveBeenCalled();
        expect(events.emit).not.toHaveBeenCalled();
        expect(pushService.sendToUser).not.toHaveBeenCalled();
        expect(expoPushService.sendToUser).not.toHaveBeenCalled();
      }
    },
  );
});
