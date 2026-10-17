import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WhatsappModule } from './whatsapp.module';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { PhoneOtpService } from './phone-otp.service';
import { WhatsappLimitsService } from './whatsapp-limits.service';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';
import {
  WHATSAPP_OTP_SENDER,
  MockWhatsappOtpSender,
  MetaWhatsappOtpSender,
  DisabledWhatsappOtpSender,
} from './senders';

@Global()
@Module({
  providers: [
    { provide: MailService, useValue: { sendVerificationEmail: jest.fn() } },
    { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
  ],
  exports: [MailService, RedisService],
})
class MockGlobalModule {}

describe('WhatsappModule Dependency Injection', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createModule = async () => {
    const mockPrisma = {
      whatsappMessageLog: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      otpChallenge: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    return Test.createTestingModule({
      imports: [WhatsappModule, MockGlobalModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();
  };

  it('compiles and resolves all exported services and sender provider', async () => {
    const moduleRef = await createModule();
    expect(moduleRef).toBeDefined();

    const phoneOtpService = moduleRef.get(PhoneOtpService);
    const limitsService = moduleRef.get(WhatsappLimitsService);
    const sender = moduleRef.get(WHATSAPP_OTP_SENDER);
    const phoneVerificationService = moduleRef.get(PhoneVerificationService);
    const phoneVerificationController = moduleRef.get(PhoneVerificationController);

    expect(phoneOtpService).toBeDefined();
    expect(limitsService).toBeDefined();
    expect(sender).toBeDefined();
    expect(phoneVerificationService).toBeDefined();
    expect(phoneVerificationController).toBeDefined();
  });

  it('resolves DisabledWhatsappOtpSender in production when unconfigured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    process.env.AUTH_PEPPER = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3';
    delete process.env.WHATSAPP_PROVIDER;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_ACCESS_TOKEN;

    const moduleRef = await createModule();
    const sender = moduleRef.get(WHATSAPP_OTP_SENDER);
    expect(sender).toBeInstanceOf(DisabledWhatsappOtpSender);
  });

  it('resolves MetaWhatsappOtpSender in production when fully configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    process.env.AUTH_PEPPER = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3';
    process.env.WHATSAPP_PROVIDER = 'meta';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '1234567890';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';

    const moduleRef = await createModule();
    const sender = moduleRef.get(WHATSAPP_OTP_SENDER);
    expect(sender).toBeInstanceOf(MetaWhatsappOtpSender);
  });

  it('resolves MockWhatsappOtpSender in non-production environments', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.WHATSAPP_PROVIDER;

    const moduleRef = await createModule();
    const sender = moduleRef.get(WHATSAPP_OTP_SENDER);
    expect(sender).toBeInstanceOf(MockWhatsappOtpSender);
  });
});
