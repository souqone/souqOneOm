import { ChatGateway } from '../chat.gateway';

describe('ChatGateway WebSocket Rate Limiting', () => {
  let gateway: ChatGateway;
  let mockChatService: any;
  let mockRedis: any;
  let mockAccessTokenGate: any;

  beforeEach(() => {
    jest.useFakeTimers();
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

  it('allows up to 5 messages within 10 seconds for a user', async () => {
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

    expect(mockChatService.sendMessage).toHaveBeenCalledTimes(5);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('rejects the 6th message within 10 seconds without disconnecting socket', async () => {
    const client = createMockClient('user-2');

    // Send 5 messages
    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: `Message ${i}`,
      });
    }

    // 6th message
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

  it('allows messages again after the 10-second window slides forward', async () => {
    const client = createMockClient('user-3');

    // Send 5 messages
    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: `Message ${i}`,
      });
    }

    // Fast forward 11 seconds
    jest.advanceTimersByTime(11_000);

    // Now message should be accepted
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

  it('keeps separate rate limit buckets per user', async () => {
    const clientA = createMockClient('user-A');
    const clientB = createMockClient('user-B');

    // User A exhausts limit
    for (let i = 1; i <= 5; i++) {
      await gateway.handleSendMessage(clientA, {
        conversationId: 'conv-1',
        content: `Message A${i}`,
      });
    }

    // User A is blocked
    const resA = await gateway.handleSendMessage(clientA, {
      conversationId: 'conv-1',
      content: 'Message A6',
    });
    expect(resA.success).toBe(false);

    // User B is NOT blocked
    const resB = await gateway.handleSendMessage(clientB, {
      conversationId: 'conv-1',
      content: 'Message B1',
    });
    expect(resB.success).toBe(true);
  });

  it('initializes cleanup timer with unref and cleans up on onModuleDestroy', async () => {
    await gateway.afterInit();
    const timer = (gateway as any).rateLimitCleanupTimer;
    expect(timer).toBeDefined();

    // Populate rate limits
    const client = createMockClient('user-cleanup');
    await gateway.handleSendMessage(client, { conversationId: 'conv-1', content: 'test' });
    expect((gateway as any).messageRateLimits.has('user-cleanup')).toBe(true);

    // Advance 65 seconds to trigger cleanup
    jest.advanceTimersByTime(65_000);
    expect((gateway as any).messageRateLimits.has('user-cleanup')).toBe(false);

    // Destroy module
    gateway.onModuleDestroy();
    expect((gateway as any).rateLimitCleanupTimer).toBeUndefined();
    expect((gateway as any).messageRateLimits.size).toBe(0);
  });
});
