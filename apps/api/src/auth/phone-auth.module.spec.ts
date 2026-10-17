import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PhoneAuthModule } from './phone-auth.module';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { WHATSAPP_OTP_SENDER } from '../whatsapp/senders';

@Global()
@Module({
  providers: [
    { provide: MailService, useValue: { sendVerificationEmail: jest.fn() } },
    { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
  ],
  exports: [MailService, RedisService],
})
class MockInfrastructureModule {}

describe('PhoneAuthModule Dependency Injection', () => {
  it('compiles and resolves PhoneAuthService and PhoneAuthController without circular DI issues', async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      whatsappMessageLog: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      otpChallenge: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      banBlacklistEntry: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [PhoneAuthModule, MockInfrastructureModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const service = moduleRef.get<PhoneAuthService>(PhoneAuthService);
    const controller = moduleRef.get<PhoneAuthController>(PhoneAuthController);

    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(service).toBeInstanceOf(PhoneAuthService);
    expect(controller).toBeInstanceOf(PhoneAuthController);
  });
});
