import { JobsController } from '../jobs.controller';
import { JobsService } from '../jobs.service';
import type { Request } from 'express';

describe('JobsController — IP resolution hardening (Task B1e)', () => {
  let controller: JobsController;
  let mockJobsService: Partial<jest.Mocked<JobsService>>;

  beforeEach(() => {
    mockJobsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'job-123', title: 'Driver' } as any),
    };

    controller = new JobsController(
      mockJobsService as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should pass req.ip to jobsService.findOne regardless of spoofed X-Forwarded-For headers', async () => {
    const realClientIp = '203.0.113.195';
    const spoofedHeader = '10.99.99.99, 198.51.100.1, 203.0.113.195';

    const fakeReq = {
      ip: realClientIp,
      headers: {
        'x-forwarded-for': spoofedHeader,
      },
    } as unknown as Request;

    await controller.findOne('job-123', fakeReq);

    // Verify jobsService.findOne was called with req.ip ('203.0.113.195') and NOT the first spoofed header entry ('10.99.99.99')
    expect(mockJobsService.findOne).toHaveBeenCalledWith('job-123', realClientIp);
    expect(mockJobsService.findOne).not.toHaveBeenCalledWith('job-123', '10.99.99.99');
  });

  it('should ignore client-supplied spoofed X-Forwarded-For variations', async () => {
    const realClientIp = '198.51.100.50';

    for (let i = 1; i <= 3; i++) {
      const fakeReq = {
        ip: realClientIp,
        headers: {
          'x-forwarded-for': `fake-spoof-${i}.attacker.org, ${realClientIp}`,
        },
      } as unknown as Request;

      await controller.findOne('job-slug-abc', fakeReq);
      expect(mockJobsService.findOne).toHaveBeenLastCalledWith('job-slug-abc', realClientIp);
    }
  });
});
