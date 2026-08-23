import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get('health/live')
  checkLiveness() {
    return { status: 'up' };
  }

  @Get('health/ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      // 1. Prisma / PostgreSQL
      () =>
        this.prisma.$queryRaw`SELECT 1`.then(() => ({
          database: { status: 'up' },
        })),
      
      // 2. Redis
      async () => {
        const isReady = this.redis.isReady();
        if (!isReady) throw new Error('Redis is not ready');
        return { redis: { status: 'up' } };
      },

      // 3. Meilisearch
      ...(process.env.NODE_ENV !== 'test'
        ? [
            () =>
              this.http.pingCheck(
                'meilisearch',
                process.env.MEILISEARCH_URL || 'http://localhost:7700/health',
              ),
          ]
        : [() => Promise.resolve({ meilisearch: { status: 'up' } } as any)]),
    ]);
  }
}
