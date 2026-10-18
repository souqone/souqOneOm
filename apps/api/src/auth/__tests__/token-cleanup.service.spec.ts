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
      loginAudit: {
        deleteMany: jest.fn().mockResolvedValue({ count: 8 }),
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

  it('cleans up expired refresh tokens, expired/consumed OTP challenges, 30-day WhatsApp logs, and 90-day LoginAudits', async () => {
    await service.cleanupExpiredTokens();

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.otpChallenge.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.whatsappMessageLog.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.loginAudit.deleteMany).toHaveBeenCalled();

    // Verify WhatsApp message log query looks for older than 30 days
    const whatsappQuery = mockPrisma.whatsappMessageLog.deleteMany.mock.calls[0][0];
    expect(whatsappQuery.where.createdAt.lt).toBeInstanceOf(Date);
    const thirtyDaysAgoApprox = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const actualCutoff = whatsappQuery.where.createdAt.lt.getTime();
    expect(Math.abs(actualCutoff - thirtyDaysAgoApprox)).toBeLessThan(5000);

    // Verify LoginAudit query looks for older than 90 days
    const loginAuditQuery = mockPrisma.loginAudit.deleteMany.mock.calls[0][0];
    expect(loginAuditQuery.where.createdAt.lt).toBeInstanceOf(Date);
    const ninetyDaysAgoApprox = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const auditCutoff = loginAuditQuery.where.createdAt.lt.getTime();
    expect(Math.abs(auditCutoff - ninetyDaysAgoApprox)).toBeLessThan(5000);
  });

  it('does not throw or fail other cleanups if LoginAudit deleteMany throws an error', async () => {
    mockPrisma.loginAudit.deleteMany.mockRejectedValue(new Error('DB connection error'));

    await expect(service.cleanupExpiredTokens()).resolves.not.toThrow();

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.otpChallenge.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.whatsappMessageLog.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.loginAudit.deleteMany).toHaveBeenCalled();
  });

  it('does not throw or stop subsequent cleanups if refreshToken deleteMany throws an error', async () => {
    mockPrisma.refreshToken.deleteMany.mockRejectedValue(new Error('DB connection error'));

    await expect(service.cleanupExpiredTokens()).resolves.not.toThrow();

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.otpChallenge.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.whatsappMessageLog.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.loginAudit.deleteMany).toHaveBeenCalled();
  });
});
