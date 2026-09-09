import { Logger } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io.adapter';

const mockClient = () => {
  const client: any = {
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
  };
  client.duplicate = jest.fn(() => mockClient());
  return client;
};

let lastCreateClientOptions: any;

jest.mock('redis', () => ({
  createClient: jest.fn((options: any) => {
    lastCreateClientOptions = options;
    return mockClient();
  }),
}));

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn(() => jest.fn()),
}));

describe('RedisIoAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastCreateClientOptions = undefined;
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('initializes without throwing', async () => {
    const adapter = new RedisIoAdapter({} as any);
    await expect(adapter.connectToRedis()).resolves.not.toThrow();
  });

  it('configures a socket.reconnectStrategy on the redis client (REDIS_URL path)', async () => {
    const prevUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = 'redis://localhost:6379';

    const adapter = new RedisIoAdapter({} as any);
    await adapter.connectToRedis();

    expect(lastCreateClientOptions?.socket?.reconnectStrategy).toBeInstanceOf(Function);

    process.env.REDIS_URL = prevUrl;
  });

  it('configures a socket.reconnectStrategy on the redis client (host/port fallback path)', async () => {
    const prevUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;

    const adapter = new RedisIoAdapter({} as any);
    await adapter.connectToRedis();

    expect(lastCreateClientOptions?.socket?.reconnectStrategy).toBeInstanceOf(Function);

    process.env.REDIS_URL = prevUrl;
  });

  it('reconnectStrategy backs off and eventually gives up', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const adapter = new RedisIoAdapter({} as any);
    await adapter.connectToRedis();

    const strategy = lastCreateClientOptions.socket.reconnectStrategy;
    expect(strategy(1)).toBe(100);
    expect(strategy(20)).toBe(2000); // grows with retries, capped at 3000ms
    expect(strategy(21)).toBeInstanceOf(Error); // gives up past the ceiling
  });
});
