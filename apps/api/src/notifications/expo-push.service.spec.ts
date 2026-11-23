import { ExpoPushService } from './expo-push.service';
import { PrismaService } from '../prisma/prisma.service';

interface PushTokenRow {
  id: string;
  token: string;
  userId: string;
  deviceType?: string;
  lastUsedAt: Date;
}

describe('ExpoPushService — Push Token Ownership & Unregister (D-B20)', () => {
  let service: ExpoPushService;
  let rows: PushTokenRow[];
  let prismaMock: any;
  let sendPushSpy: jest.SpyInstance;

  const TOKEN = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';

  beforeEach(() => {
    rows = [];

    const makeDelegate = () => ({
      deleteMany: jest.fn(async ({ where }: any) => {
        const before = rows.length;
        rows = rows.filter((r) => {
          if (where.token) {
            if (typeof where.token === 'string' && r.token !== where.token) return true;
            if (where.token.in && !where.token.in.includes(r.token)) return true;
          }
          if (where.userId) {
            if (typeof where.userId === 'string' && r.userId !== where.userId) return true;
            if (where.userId.not && r.userId === where.userId.not) return true;
          }
          return false;
        });
        return { count: before - rows.length };
      }),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const existing = rows.find((r) => r.token === where.token);
        if (existing) {
          existing.userId = update.userId;
          existing.deviceType = update.deviceType;
          existing.lastUsedAt = update.lastUsedAt ?? new Date();
          return existing;
        }
        const created: PushTokenRow = {
          id: `pt-${rows.length + 1}`,
          token: create.token,
          userId: create.userId,
          deviceType: create.deviceType,
          lastUsedAt: new Date(),
        };
        rows.push(created);
        return created;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return rows.filter((r) => r.userId === where.userId);
      }),
    });

    const pushTokenDelegate = makeDelegate();
    prismaMock = {
      pushToken: pushTokenDelegate,
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb({ pushToken: pushTokenDelegate });
      }),
    };

    service = new ExpoPushService(prismaMock as unknown as PrismaService);
    sendPushSpy = jest
      .spyOn((service as any).expo, 'sendPushNotificationsAsync')
      .mockResolvedValue([{ status: 'ok', id: 'ticket-1' }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('re-registering the same token by account B transfers ownership in ONE transaction and stops pushes to account A', async () => {
    await service.registerToken('user-A', TOKEN, 'android');
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe('user-A');

    prismaMock.$transaction.mockClear();

    // Account B logs in on the same device and registers the same token
    await service.registerToken('user-B', TOKEN, 'android');

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ token: TOKEN, userId: 'user-B' });

    // Account A must NOT receive any push for this token
    await service.sendToUser('user-A', { title: 'Hello A', body: 'Test' });
    expect(sendPushSpy).not.toHaveBeenCalled();

    // Account B MUST receive pushes for this token
    await service.sendToUser('user-B', { title: 'Hello B', body: 'Test' });
    expect(sendPushSpy).toHaveBeenCalledTimes(1);
    expect(sendPushSpy.mock.calls[0][0][0].to).toBe(TOKEN);
  });

  it('rejects invalid Expo push tokens without touching the database', async () => {
    await expect(service.registerToken('user-A', 'not-a-valid-token', 'ios')).rejects.toThrow(
      'Invalid Expo push token format',
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0);
  });

  it('unregisterToken removes only the calling user tokens and is idempotent', async () => {
    await service.registerToken('user-A', TOKEN, 'ios');
    const otherToken = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';
    await service.registerToken('user-B', otherToken, 'android');

    // User A unregisters with no specific token (matches mobile logout DELETE /users/push-token)
    await service.unregisterToken('user-A');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: 'user-B', token: otherToken });

    // Second unregister call is idempotent (no error)
    await expect(service.unregisterToken('user-A')).resolves.toBeUndefined();

    // User A cannot unregister User B's token even if they pass B's token string
    await service.unregisterToken('user-A', otherToken);
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe('user-B');

    // User B can unregister their specific token
    await service.unregisterToken('user-B', otherToken);
    expect(rows).toHaveLength(0);
  });
});
