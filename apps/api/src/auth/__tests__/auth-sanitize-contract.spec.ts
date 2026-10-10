import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../mail/mail.module';
import { RedisModule } from '../../redis/redis.module';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { SanitizeInterceptor } from '../../common/interceptors/sanitize.interceptor';

describe('Auth Endpoints with SanitizeInterceptor (Contract & E2E Verification)', () => {
  let app: INestApplication;

  const mockUserWithSecrets = {
    id: 'user-123',
    email: 'test@souqone.om',
    username: 'souqone_user',
    displayName: 'SouqOne User',
    role: 'USER',
    avatarUrl: null,
    isVerified: true,
    governorate: 'Muscat',
    passwordHash: '$2a$10$unleakedpasswordhashsecret1234567890',
    googleId: 'google-sub-secret-12345',
    tokenVersion: 4,
    passwordResetCode: '999999',
    passwordResetExpiry: new Date(Date.now() + 100000),
    verificationCode: '111111',
    verificationExpiry: new Date(Date.now() + 100000),
  };

  const mockAuthService = {
    signup: jest.fn().mockImplementation(async () => ({
      accessToken: 'jwt-access-token-signup-123',
      refreshToken: 'refresh-token-signup-456',
      user: { ...mockUserWithSecrets },
      requiresVerification: false,
    })),
    login: jest.fn().mockImplementation(async () => ({
      accessToken: 'jwt-access-token-login-123',
      refreshToken: 'refresh-token-login-456',
      user: { ...mockUserWithSecrets },
    })),
    refresh: jest.fn().mockImplementation(async () => ({
      accessToken: 'jwt-access-token-refreshed-123',
      refreshToken: 'refresh-token-refreshed-456',
    })),
    googleAuth: jest.fn().mockImplementation(async () => ({
      accessToken: 'jwt-access-token-google-123',
      refreshToken: 'refresh-token-google-456',
      user: { ...mockUserWithSecrets },
    })),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, MailModule, RedisModule, AuthModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(MailService)
      .useValue({})
      .overrideProvider(RedisService)
      .useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();

    // Replicate main.ts exact configuration: prefix, global pipes, and SanitizeInterceptor
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new SanitizeInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login must return refreshToken and sanitize user sensitive fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@souqone.om', password: 'Password123!' })
      .expect(201);

    // Refresh token MUST NOT be stripped by SanitizeInterceptor
    expect(res.body.refreshToken).toBe('refresh-token-login-456');
    expect(res.body.accessToken).toBe('jwt-access-token-login-123');

    // Sensitive User fields MUST remain stripped
    expect(res.body.user).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.googleId).toBeUndefined();
    expect(res.body.user.tokenVersion).toBeUndefined();
    expect(res.body.user.passwordResetCode).toBeUndefined();
    expect(res.body.user.verificationCode).toBeUndefined();
  });

  it('POST /api/auth/refresh must return new refreshToken alongside accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'existing-refresh-token' })
      .expect(201);

    expect(res.body.refreshToken).toBe('refresh-token-refreshed-456');
    expect(res.body.accessToken).toBe('jwt-access-token-refreshed-123');
  });

  it('POST /api/auth/signup must return refreshToken and sanitize user sensitive fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: 'new@souqone.om', username: 'newuser', password: 'Password123!' })
      .expect(201);

    expect(res.body.refreshToken).toBe('refresh-token-signup-456');
    expect(res.body.accessToken).toBe('jwt-access-token-signup-123');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.googleId).toBeUndefined();
    expect(res.body.user.tokenVersion).toBeUndefined();
  });

  it('POST /api/auth/register must also return refreshToken and sanitize user sensitive fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'registered@souqone.om', username: 'reguser', password: 'Password123!' })
      .expect(201);

    expect(res.body.refreshToken).toBe('refresh-token-signup-456');
    expect(res.body.accessToken).toBe('jwt-access-token-signup-123');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.googleId).toBeUndefined();
    expect(res.body.user.tokenVersion).toBeUndefined();
  });

  it('POST /api/auth/google must return refreshToken alongside accessToken and sanitized user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/google')
      .send({ credential: 'mock-google-token' })
      .expect(201);

    expect(res.body.refreshToken).toBe('refresh-token-google-456');
    expect(res.body.accessToken).toBe('jwt-access-token-google-123');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.googleId).toBeUndefined();
    expect(res.body.user.tokenVersion).toBeUndefined();
  });
});
