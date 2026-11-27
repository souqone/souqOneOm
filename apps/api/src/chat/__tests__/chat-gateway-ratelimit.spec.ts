import { ChatGateway } from '../chat.gateway';
import { CHAT_WS_SEND_KEY_PREFIX, CHAT_WS_SEND_WINDOW_SEC } from '../chat-security.constants';

describe('ChatGateway WebSocket Rate Limiting (Redis-backed)', () => {
  let gateway: ChatGateway;
  let mockChatService: any;
  let mockRedis: any;
  let mockAccessTokenGate: any;
  let redisStore: Map<string, { count: number; expiresAt: number }>;

  beforeEach(() => {
    jest.useFakeTimers();
    redisStore = new Map();

    mockChatService = {
      sendMessage: jest.fn().mockImplementation((conversationId, dto, userId) => {
        return Promise.resolve({
          id: 'msg-' + Math.random(),
          conversationId,
          content: dto.content,
          senderId: userId,
        });
      }),
      getConversationIds: jest.fn().mockResolvedValue([]),
    };
    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockImplementation(async (key: string, ttlSeconds?: number) => {
        const now = Date.now();
        const existing = redisStore.get(key);
        if (!existing || now >= existing.expiresAt) {
          const entry = {
            count: 1,
            expiresAt: now + (ttlSeconds ?? CHAT_WS_SEND_WINDOW_SEC) * 1000,
          };
          redisStore.set(key, entry);
          return 1;
        }
        existing.count += 1;
        return existing.count;
      }),
    };
    mockAccessTokenGate = {
      validate: jest.fn().mockResolvedValue(undefined),
    };

    gateway = new ChatGateway(mockChatService, mockRedis, mockAccessTokenGate);
  });

  afterEach(() => {
    gateway.onModuleDestroy();
    jest.useRealTimers();
  });

  function createMockClient(userId: string) {
    return {
      id: 'socket-' + userId,
      data: {
        user: { sub: userId, username: 'user-' + userId, role: 'USER' },
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as any;
  }

  it('allows up to 5 messages within 10 seconds using Redis INCR', async () => {
    const client = createMockClient('user-1');

    for (let i = 1; i <= 5; i++) {
      const res = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: `Message ${i}`,
      });
      expect(res).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.objectContaining({ content: `Message ${i}` }),
        }),
      );
    }

    expect(mockRedis.incr).toHaveBeenCalledWith(
      `${CHAT_WS_SEND_KEY_PREFIX}user-1`,
      CHAT_WS_SEND_WINDOW_SEC,
    );
    expect(mockChatService.sendMessage).toHaveBeenCalledTimes(5);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('rejects the 6th message within 10 seconds without disconnecting socket', async () => {
    const client = createMockClient('user-2');

    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: `Message ${i}`,
      });
    }

    const res = await gateway.handleSendMessage(client, {
      conversationId: 'conv-1',
      content: 'Message 6 - should exceed rate limit',
    });

    const expectedError = 'أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار ثوانٍ ثم إعادة المحاولة.';
    expect(res).toEqual({
      success: false,
      error: expectedError,
    });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: expectedError,
    });
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(mockChatService.sendMessage).toHaveBeenCalledTimes(5);
  });

  it('allows messages again after the 10-second Redis TTL expires', async () => {
    const client = createMockClient('user-3');

    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: `Message ${i}`,
      });
    }

    jest.advanceTimersByTime(11_000);

    const res = await gateway.handleSendMessage(client, {
      conversationId: 'conv-1',
      content: 'Message after cooldown',
    });

    expect(res).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.objectContaining({ content: 'Message after cooldown' }),
      }),
    );
    expect(mockChatService.sendMessage).toHaveBeenCalledTimes(6);
  });

  it('keeps separate Redis rate limit buckets per user', async () => {
    const clientA = createMockClient('user-A');
    const clientB = createMockClient('user-B');

    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(clientA, {
        conversationId: 'conv-1',
        content: `Message A${i}`,
      });
    }

    const resA = await gateway.handleSendMessage(clientA, {
      conversationId: 'conv-1',
      content: 'Message A6',
    });
    expect(resA.success).toBe(false);

    const resB = await gateway.handleSendMessage(clientB, {
      conversationId: 'conv-1',
      content: 'Message B1',
    });
    expect(resB.success).toBe(true);
  });
});
