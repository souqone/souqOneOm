import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  ALL_STRUCTURED_VALIDATION_DTOS,
  createAppValidationPipe,
} from '../../common/pipes/validation-field-errors';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpoPushService } from '../expo-push.service';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import { PushService } from '../push.service';

describe('D-B25 Notifications unread-count excludeChat=true', () => {
  let service: NotificationsService;
  let controller: NotificationsController;
  let app: INestApplication;
  let storedNotifications: Array<{
    userId: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
  }>;
  let mockPrisma: {
    notification: {
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const now = new Date();
    const expired = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    storedNotifications = [
      { userId: 'u-1', type: NotificationType.MESSAGE, isRead: false, createdAt: now },
      { userId: 'u-1', type: NotificationType.MESSAGE, isRead: false, createdAt: now },
      { userId: 'u-1', type: NotificationType.LISTING_FAVORITED, isRead: false, createdAt: now },
      { userId: 'u-1', type: NotificationType.SYSTEM, isRead: false, createdAt: now },
      { userId: 'u-1', type: NotificationType.SYSTEM, isRead: true, createdAt: now },
      { userId: 'u-1', type: NotificationType.SYSTEM, isRead: false, createdAt: expired },
    ];

    mockPrisma = {
      notification: {
        count: jest.fn().mockImplementation(async ({ where }: { where: any }) => {
          return storedNotifications.filter((n) => {
            if (where.userId && n.userId !== where.userId) return false;
            if (where.isRead !== undefined && n.isRead !== where.isRead) return false;
            if (where.createdAt?.gt && !(n.createdAt > where.createdAt.gt)) return false;
            if (where.type?.not && n.type === where.type.not) return false;
            return true;
          }).length;
        }),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: PushService, useValue: { getPublicKey: jest.fn(), sendToUser: jest.fn() } },
        { provide: ExpoPushService, useValue: { sendToUser: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { sub: 'u-1', username: 'user1', role: 'USER' };
          return true;
        },
      })
      .compile();

    service = moduleRef.get(NotificationsService);
    controller = moduleRef.get(NotificationsController);
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(createAppValidationPipe(ALL_STRUCTURED_VALIDATION_DTOS));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('default getUnreadCount counts MESSAGE notifications alongside other types and enforces 90-day retention', async () => {
    const res = await service.getUnreadCount('u-1');
    // 2 MESSAGE + 1 LISTING_FAVORITED + 1 SYSTEM (isRead=false, within 90d) = 4
    expect(res).toEqual({ count: 4 });

    const where = mockPrisma.notification.count.mock.calls[0][0].where;
    expect(where).toEqual({
      userId: 'u-1',
      isRead: false,
      createdAt: { gt: expect.any(Date) },
    });
    expect(where).not.toHaveProperty('type');
  });

  it('excludes NotificationType.MESSAGE when excludeChat=true while keeping 90-day retention', async () => {
    const res = await service.getUnreadCount('u-1', { excludeChat: true });
    // 1 LISTING_FAVORITED + 1 SYSTEM (excludes 2 MESSAGE, 1 read, 1 >90d) = 2
    expect(res).toEqual({ count: 2 });

    const where = mockPrisma.notification.count.mock.calls[0][0].where;
    expect(where).toEqual({
      userId: 'u-1',
      isRead: false,
      createdAt: { gt: expect.any(Date) },
      type: { not: NotificationType.MESSAGE },
    });
  });

  it('HTTP GET /notifications/unread-count handles omitted, true, false, 1, and garbage values with 200 and global forbidNonWhitelisted pipe', async () => {
    const defaultRes = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .expect(200);
    expect(defaultRes.body).toEqual({ count: 4 });

    const excludeRes = await request(app.getHttpServer())
      .get('/notifications/unread-count?excludeChat=true')
      .expect(200);
    expect(excludeRes.body).toEqual({ count: 2 });

    for (const val of ['false', '1', 'TRUE', 'garbage']) {
      const nonTrueRes = await request(app.getHttpServer())
        .get(`/notifications/unread-count?excludeChat=${encodeURIComponent(val)}`)
        .expect(200);
      expect(nonTrueRes.body).toEqual({ count: 4 });
    }
    expect(controller).toBeDefined();
  });
});
