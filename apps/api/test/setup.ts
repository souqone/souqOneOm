import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.test BEFORE any NestJS/Prisma imports so DATABASE_URL is set correctly
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: true });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisModule } from '../src/redis/redis.module';
import { RedisService } from '../src/redis/redis.service';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ListingsModule } from '../src/listings/listings.module';
import { ChatModule } from '../src/chat/chat.module';
import { FavoritesModule } from '../src/favorites/favorites.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { UploadsModule } from '../src/uploads/uploads.module';
import { MailModule } from '../src/mail/mail.module';
import { CloudinaryModule } from '../src/cloudinary/cloudinary.module';
import { CarsModule } from '../src/cars/cars.module';
import { BookingsModule } from '../src/bookings/bookings.module';
import { JobsModule } from '../src/jobs/jobs.module';
import { PartsModule } from '../src/parts/parts.module';
import { ServicesModule } from '../src/services/services.module';
import { TransportModule } from '../src/transport/transport.module';
import { SearchModule } from '../src/search/search.module';
import { BusesModule } from '../src/buses/buses.module';
import { EquipmentModule } from '../src/equipment/equipment.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { MailService } from '../src/mail/mail.service';
import { MEILI_CLIENT } from '../src/search/meili.provider';
import { cleanDatabase } from './cleanup';
import request from 'supertest';

/** Mock RedisService so tests don't need a running Redis instance */
class MockRedisService {
  private store = new Map<string, string>();
  private ttls = new Map<string, number>();
  async onModuleInit() {}
  async onModuleDestroy() {}
  getClient() { return null; }
  getPublisher() { return null; }
  getSubscriber() { return null; }
  isReady() { return false; }
  async get<T>(key: string): Promise<T | null> {
    const v = this.store.get(key);
    return v ? JSON.parse(v) : null;
  }
  async set(key: string, value: any, ttl?: number) {
    this.store.set(key, JSON.stringify(value));
    if (ttl) this.ttls.set(key, ttl);
  }
  async del(key: string) { this.store.delete(key); this.ttls.delete(key); }
  async delPattern(_pattern: string) {}
  async exists(key: string) { return this.store.has(key); }
  async expire(key: string, seconds: number) { this.ttls.set(key, seconds); }
  async incr(key: string, ttl?: number): Promise<number> {
    const current = this.store.get(key);
    const val = current ? parseInt(current, 10) + 1 : 1;
    this.store.set(key, String(val));
    if (ttl) this.ttls.set(key, ttl);
    return val;
  }
  async getTTL(key: string): Promise<number> {
    return this.ttls.get(key) ?? -1;
  }
  async publish(_channel: string, _message: any) {}
  async subscribe(_channel: string, _callback: any) {}
  async unsubscribe(_channel: string) {}
}

/** Mock MailService — no-op, prevents real email sends during tests */
class MockMailService {
  async sendVerificationEmail(_to: string, _code: string): Promise<void> {}
  async sendPasswordResetEmail(_to: string, _code: string): Promise<void> {}
}

/** No-op throttle guard — always allows requests */
class NoopThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(): Promise<boolean> {
    return true;
  }
}

let app: INestApplication;
let prisma: PrismaService;

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      EventEmitterModule.forRoot(),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 999999 }]),
      PrismaModule,
      RedisModule,
      AuthModule,
      UsersModule,
      ListingsModule,
      ChatModule,
      FavoritesModule,
      NotificationsModule,
      UploadsModule,
      MailModule,
      CloudinaryModule,
      CarsModule,
      BookingsModule,
      JobsModule,
      PartsModule,
      ServicesModule,
      TransportModule,
      SearchModule,
      BusesModule,
      EquipmentModule,
    ],
    controllers: [AppController],
    providers: [
      AppService,
      { provide: APP_GUARD, useClass: NoopThrottlerGuard },
    ],
  })
    .overrideProvider(RedisService)
    .useClass(MockRedisService)
    .overrideProvider(MailService)
    .useClass(MockMailService)
    .overrideProvider(MEILI_CLIENT)
    .useValue(null)
    .compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.init();
  prisma = app.get(PrismaService);

  // Clean database before each test suite for full isolation
  await cleanDatabase(prisma);

  return app;
}

export function getApp(): INestApplication {
  return app;
}

export function getPrisma(): PrismaService {
  return prisma;
}

export async function closeTestApp() {
  // Clean up test data after the suite finishes
  if (prisma) {
    try {
      await cleanDatabase(prisma);
    } catch {
      // Ignore cleanup errors during teardown
    }
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
  if (app) {
    await app.close();
    app = undefined as any;
    prisma = undefined as any;
  }
}

/** Unique suffix for test isolation */
let counter = 0;
export function uniqueId(): string {
  return `${Date.now()}_${++counter}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Register a new user and return the access token */
export async function registerUser(overrides?: {
  email?: string;
  username?: string;
  password?: string;
}): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  const uid = uniqueId();
  const payload = {
    email: overrides?.email || `test_${uid}@test.com`,
    username: overrides?.username || `user_${uid}`,
    password: overrides?.password || 'TestPass123!',
  };

  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send(payload)
    .expect(201);

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    user: res.body.user,
  };
}

/** Create a rental listing and return its ID (for booking tests) */
export async function createRentalListing(accessToken: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/listings')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Rental Car for E2E Test',
      description: 'Test rental listing for booking E2E tests',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: 5000,
      listingType: 'RENTAL',
      dailyPrice: 15,
      weeklyPrice: 90,
      monthlyPrice: 350,
      minRentalDays: 1,
      condition: 'USED',
      governorate: 'Muscat',
    })
    .expect(201);
  return res.body.id;
}

/** Login with existing credentials */
export async function loginUser(email: string, password: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    user: res.body.user,
  };
}
