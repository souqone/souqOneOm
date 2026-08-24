import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  async connectToRedis(): Promise<void> {
    this.logger.log('[DIAG] connectToRedis() started');
    const redisUrl = process.env.REDIS_URL;
    this.logger.log(`REDIS_URL configured: ${!!redisUrl}`);

    const maxAttempts = 5;
    const baseDelayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const pubClient = redisUrl
          ? createClient({ url: redisUrl })
          : createClient({
              socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
              },
              password: process.env.REDIS_PASSWORD || undefined,
            });

        const subClient = pubClient.duplicate();

        // Surface connection drops AFTER a successful initial connect too —
        // the 'redis' client library auto-reconnects by default, but we log
        // it loudly so it's visible in monitoring instead of silent.
        pubClient.on('error', (err) => this.logger.error(`Redis IO Adapter pubClient error: ${err.message}`));
        subClient.on('error', (err) => this.logger.error(`Redis IO Adapter subClient error: ${err.message}`));

        await Promise.all([pubClient.connect(), subClient.connect()]);

        this.adapterConstructor = createAdapter(pubClient, subClient);
        this.logger.log(`Redis Socket.IO Adapter connected (attempt ${attempt}/${maxAttempts})`);
        return;
      } catch (err) {
        const message = (err as Error).message;
        if (attempt === maxAttempts) {
          // Loud, unambiguous failure — this state should never pass silently
          this.logger.error(
            `Redis Socket.IO Adapter FAILED after ${maxAttempts} attempts — ` +
            `falling back to in-memory adapter. Real-time features will NOT ` +
            `work correctly across multiple instances until this is fixed ` +
            `and the server is restarted. Last error: ${message}`,
          );
          this.adapterConstructor = null;
          return;
        }
        const delay = baseDelayMs * attempt;
        this.logger.warn(`Redis Socket.IO Adapter attempt ${attempt}/${maxAttempts} failed (${message}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    this.logger.log('[DIAG] createIOServer() called');
    const server = super.createIOServer(port, options);
    this.logger.log(`[DIAG] super.createIOServer() returned, server object exists: ${!!server}`);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
