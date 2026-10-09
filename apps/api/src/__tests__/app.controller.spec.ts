import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from '../app.controller';

describe('AppController — Readiness Error Masking & Health', () => {
  let controller: AppController;
  let mockHealth: any;
  let mockHttp: any;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockHealth = {
      check: jest.fn(),
    };
    mockHttp = {
      pingCheck: jest.fn(),
    };
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };
    mockRedis = {
      isReady: jest.fn().mockReturnValue(true),
    };

    controller = new AppController(mockHealth, mockHttp, mockPrisma, mockRedis);
  });

  afterEach(async () => {
    await controller.onModuleDestroy();
  });

  describe('GET /health/live', () => {
    it('should return up status and commit SHA', () => {
      const res = controller.checkLiveness();
      expect(res.status).toBe('up');
      expect(res.commit).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return Terminus result when all indicators pass', async () => {
      const healthyResponse = {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
      };
      mockHealth.check.mockResolvedValue(healthyResponse);

      const result = await controller.checkReadiness();
      expect(result).toEqual(healthyResponse);
    });

    it('should catch Terminus internal failure, log it, and return generic ServiceUnavailableException without leaking internal details', async () => {
      const internalError = new Error('Connection refused to redis://private.internal:6379');
      mockHealth.check.mockRejectedValue(internalError);

      try {
        await controller.checkReadiness();
        fail('Expected checkReadiness to throw ServiceUnavailableException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ServiceUnavailableException);
        const res = err.getResponse();
        expect(res).toEqual({
          status: 'error',
          message: 'Service unavailable',
        });
        // Ensure no internal URLs or connection strings are present in the response
        expect(JSON.stringify(res)).not.toContain('redis://private.internal');
      }
    });
  });
});
