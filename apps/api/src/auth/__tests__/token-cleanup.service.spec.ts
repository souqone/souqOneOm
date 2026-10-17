import { Test, TestingModule } from '@nestjs/testing';
import { TokenCleanupService } from '../token-cleanup.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TokenCleanupService', () => {
  let service: TokenCleanupService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
      otpChallenge: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      whatsappMessageLog: {
        deleteMany: jest.fn().mockResolvedValue({ count: 12 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenCleanupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TokenCleanupService>(TokenCleanupService);
  });

  it('cleans up expired refresh tokens, expired/consumed OTP challenges, and 30-day WhatsApp logs', async () => {
    await service.cleanupExpiredTokens();

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.otpChallenge.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.whatsappMessageLog.deleteMany).toHaveBeenCalled();

    // Verify WhatsApp message log query looks for older than 30 days
    const whatsappQuery = mockPrisma.whatsappMessageLog.deleteMany.mock.calls[0][0];
    expect(whatsappQuery.where.createdAt.lt).toBeInstanceOf(Date);
    const thirtyDaysAgoApprox = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const actualCutoff = whatsappQuery.where.createdAt.lt.getTime();
    expect(Math.abs(actualCutoff - thirtyDaysAgoApprox)).toBeLessThan(5000);
  });
});
