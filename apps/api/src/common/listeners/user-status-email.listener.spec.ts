import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';
import { UserStatusEmailListener } from './user-status-email.listener';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { UserStatusChangedPayload } from '../events/user-status.events';

describe('UserStatusEmailListener', () => {
  let listener: UserStatusEmailListener;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let mockMailService: {
    sendAccountSuspendedEmail: jest.Mock;
    sendAccountBannedEmail: jest.Mock;
  };

  const rawTestEmail = 'target.user@example.com';
  const testUserId = 'usr-123456';
  const testDisplayName = 'أحمد العماني';

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    mockMailService = {
      sendAccountSuspendedEmail: jest.fn().mockResolvedValue(undefined),
      sendAccountBannedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatusEmailListener,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    listener = module.get<UserStatusEmailListener>(UserStatusEmailListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Exit guards before database query', () => {
    it('should ignore null or undefined payload without throwing', async () => {
      await expect(listener.handleUserStatusChanged(null as any)).resolves.not.toThrow();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should ignore payload missing userId', async () => {
      const payload: UserStatusChangedPayload = {
        userId: '',
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
    });

    it('should ignore event when previousStatus === status', async () => {
      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.SUSPENDED,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when status transitioned to ACTIVE', async () => {
      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.SUSPENDED,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when status transitioned to DELETED', async () => {
      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.DELETED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });
  });

  describe('User lookup and sending behavior', () => {
    it('should send suspended email once with expiry date when suspendedUntil is provided', async () => {
      const expiryDate = new Date('2026-11-01T12:00:00Z');
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: expiryDate,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: expiryDate,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUserId },
        select: {
          email: true,
          displayName: true,
          status: true,
          suspendedUntil: true,
        },
      });
      expect(mockMailService.sendAccountSuspendedEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendAccountSuspendedEmail).toHaveBeenCalledWith(
        rawTestEmail,
        expiryDate,
        testDisplayName,
      );
      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should send suspended email without expiry date when suspendedUntil is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountSuspendedEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendAccountSuspendedEmail).toHaveBeenCalledWith(
        rawTestEmail,
        null,
        testDisplayName,
      );
    });

    it('should fall back to user.suspendedUntil if payload.suspendedUntil is null', async () => {
      const dbDate = new Date('2026-12-15T00:00:00Z');
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: dbDate,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountSuspendedEmail).toHaveBeenCalledWith(
        rawTestEmail,
        dbDate,
        testDisplayName,
      );
    });

    it('should send banned email when status is BANNED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountBannedEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendAccountBannedEmail).toHaveBeenCalledWith(
        rawTestEmail,
        testDisplayName,
      );
      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user is not found in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user has no email address (phone-only user)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: null,
        displayName: testDisplayName,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user email is anonymized placeholder [DELETED]', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: '[DELETED]',
        displayName: 'مستخدم محذوف',
        status: AccountStatus.BANNED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user email has deleted_ prefix or invalid format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'deleted_user_123',
        displayName: 'مستخدم محذوف',
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
    });

    it('should not send email when user current status in DB is DELETED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.DELETED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountBannedEmail).not.toHaveBeenCalled();
    });

    it('should not send email on stale event (database status differs from payload.status)', async () => {
      // User was already transitioned back to ACTIVE before this delayed event fired
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.ACTIVE,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: new Date(),
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      expect(mockMailService.sendAccountSuspendedEmail).not.toHaveBeenCalled();
    });
  });

  describe('Error handling and resilience', () => {
    it('should catch database errors and not throw to caller', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB connection timeout'));

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await expect(listener.handleUserStatusChanged(payload)).resolves.not.toThrow();
    });

    it('should catch mailService errors and not throw to caller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
      });
      mockMailService.sendAccountBannedEmail.mockRejectedValue(new Error('SMTP unreachable'));

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await expect(listener.handleUserStatusChanged(payload)).resolves.not.toThrow();
    });
  });

  describe('Privacy and PII protection in logs', () => {
    it('should never log full raw email in success or error logs', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      mockPrisma.user.findUnique.mockResolvedValue({
        email: rawTestEmail,
        displayName: testDisplayName,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
      });

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.SUSPENDED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      const allLoggedMessages = [
        ...logSpy.mock.calls.map((c) => String(c[0])),
        ...debugSpy.mock.calls.map((c) => String(c[0])),
        ...errorSpy.mock.calls.map((c) => String(c[0])),
      ];

      for (const msg of allLoggedMessages) {
        expect(msg).not.toContain(rawTestEmail);
      }

      // Verify masked email appears in the success log
      expect(allLoggedMessages.some((msg) => msg.includes('t***@example.com'))).toBe(true);
    });

    it('should redact any email inside error messages in error log', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      mockPrisma.user.findUnique.mockRejectedValue(
        new Error(`Failed to query user ${rawTestEmail}`),
      );

      const payload: UserStatusChangedPayload = {
        userId: testUserId,
        previousStatus: AccountStatus.ACTIVE,
        status: AccountStatus.BANNED,
        suspendedUntil: null,
        at: new Date(),
      };

      await listener.handleUserStatusChanged(payload);

      const errorCalls = errorSpy.mock.calls.map((c) => String(c[0]));
      for (const msg of errorCalls) {
        expect(msg).not.toContain(rawTestEmail);
        expect(msg).toContain('t***@example.com');
      }
    });
  });
});
