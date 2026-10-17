import { Test, TestingModule } from '@nestjs/testing';
import { BanBlacklistModule } from './ban-blacklist.module';
import { BanBlacklistService } from './ban-blacklist.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BanBlacklistModule (DI Proof)', () => {
  let moduleRef: TestingModule;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('compiles BanBlacklistModule and resolves real BanBlacklistService without errors', async () => {
    const mockPrisma = {
      banBlacklistEntry: {
        findUnique: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    moduleRef = await Test.createTestingModule({
      imports: [BanBlacklistModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const service = moduleRef.get<BanBlacklistService>(BanBlacklistService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(BanBlacklistService);
    expect(typeof service.hashPhone).toBe('function');
    expect(typeof service.isPhoneBlocked).toBe('function');
  });

  it('boots AuthModule with real BanBlacklistModule (minimal real set, no mock for BanBlacklistModule)', async () => {
    const { Global, Module } = await import('@nestjs/common');
    const { AuthModule } = await import('../auth/auth.module');
    const { AuthService } = await import('../auth/auth.service');
    const { MailService } = await import('../mail/mail.service');
    const { RedisService } = await import('../redis/redis.service');

    @Global()
    @Module({
      providers: [
        { provide: MailService, useValue: { sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), incr: jest.fn(), getTTL: jest.fn() } },
      ],
      exports: [MailService, RedisService],
    })
    class MockGlobalModule {}

    const mockPrisma = {
      banBlacklistEntry: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      refreshToken: { findUnique: jest.fn() },
      loginAudit: { create: jest.fn() },
    };

    moduleRef = await Test.createTestingModule({
      imports: [AuthModule, MockGlobalModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const authService = moduleRef.get<AuthService>(AuthService);
    const blacklistService = moduleRef.get<BanBlacklistService>(BanBlacklistService);

    expect(authService).toBeDefined();
    expect(blacklistService).toBeDefined();
    expect(blacklistService).toBeInstanceOf(BanBlacklistService);
    expect((authService as any).banBlacklistService).toBe(blacklistService);
  });
});
