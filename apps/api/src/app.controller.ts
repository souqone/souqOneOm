import { Controller, Get, OnModuleDestroy } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import Redis from 'ioredis';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController implements OnModuleDestroy {
  // Dedicated client for the Bull/BullMQ Redis connection (search-sync queue) —
  // Bull doesn't expose its internal ioredis client, so this pings the same
  // REDIS_URL independently for health-check purposes only.
  private readonly bullRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    connectionName: 'redis-bull',
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async onModuleDestroy() {
    await this.bullRedisClient.quit().catch(() => {});
  }

  @Get('health/live')
  checkLiveness() {
    return { 
      status: 'up',
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown'
    };
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
      
      // 2. Redis (RedisService client — cache / pub-sub / rate limiting)
      async () => {
        const isReady = this.redis.isReady();
        if (!isReady) throw new Error('Redis is not ready');
        return { redis: { status: 'up' } };
      },

      // 3. Redis (Bull queue connection — search-sync / OutboxRelayService)
      async () => {
        try {
          await this.bullRedisClient.ping();
          return { 'redis-bull': { status: 'up' } };
        } catch (err) {
          throw new Error(`Bull Redis connection is not ready: ${(err as Error).message}`);
        }
      },

      // 4. Meilisearch
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
