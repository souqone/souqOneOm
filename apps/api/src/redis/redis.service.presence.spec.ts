import { RedisService } from './redis.service';
import { userOnlineKey } from './presence.helper';

describe('RedisService Presence Helpers', () => {
  let service: RedisService;
  let mockPipeline: { exists: jest.Mock; exec: jest.Mock };
  let mockClient: { exists: jest.Mock; pipeline: jest.Mock };

  beforeEach(() => {
    service = new RedisService();
    mockPipeline = {
      exists: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    mockClient = {
      exists: jest.fn(),
      pipeline: jest.fn(() => mockPipeline),
    };
    (service as any).client = mockClient;
    (service as any).connected = true;
  });

  it('userOnlineKey builds canonical user:online:{id} key', () => {
    expect(userOnlineKey('u-42')).toBe('user:online:u-42');
  });

  it('getOnlineUserIds checks N distinct userIds in ONE pipeline call and returns online Set', async () => {
    mockPipeline.exec.mockResolvedValue([
      [null, 1],
      [null, 0],
    ]);

    const result = await service.getOnlineUserIds(['u-1', 'u-2', 'u-1']);

    expect(mockClient.pipeline).toHaveBeenCalledTimes(1);
    expect(mockPipeline.exists).toHaveBeenCalledTimes(2);
    expect(mockPipeline.exists).toHaveBeenCalledWith('user:online:u-1');
    expect(mockPipeline.exists).toHaveBeenCalledWith('user:online:u-2');
    expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    expect(result).toEqual(new Set(['u-1']));
  });

  it('getOnlineUserIds returns empty Set and never throws on Redis error or disconnect', async () => {
    mockPipeline.exec.mockRejectedValueOnce(new Error('Redis ECONNREFUSED'));
    await expect(service.getOnlineUserIds(['u-1'])).resolves.toEqual(new Set());

    (service as any).connected = false;
    await expect(service.getOnlineUserIds(['u-1'])).resolves.toEqual(new Set());
  });

  it('isUserOnline returns true/false and falls back to false on Redis error or disconnect', async () => {
    mockClient.exists.mockResolvedValueOnce(1);
    await expect(service.isUserOnline('u-1')).resolves.toBe(true);
    expect(mockClient.exists).toHaveBeenCalledWith('user:online:u-1');

    mockClient.exists.mockRejectedValueOnce(new Error('Redis timeout'));
    await expect(service.isUserOnline('u-1')).resolves.toBe(false);

    (service as any).connected = false;
    await expect(service.isUserOnline('u-1')).resolves.toBe(false);
  });
});
