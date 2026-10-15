import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountStatusService } from './account-status.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenGate } from './access-token-gate.service';
import { USER_STATUS_CHANGED, UserStatusChangedPayload } from '../common/events/user-status.events';

describe('AccountStatusService', () => {
  let service: AccountStatusService;
  let mockPrisma: any;
  let mockGate: any;
  let mockEvents: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockGate = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    mockEvents = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountStatusService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccessTokenGate, useValue: mockGate },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<AccountStatusService>(AccountStatusService);
  });

  describe('assertCanAuthenticate', () => {
    it('allows ACTIVE user to pass without error', async () => {
      await expect(
        service.assertCanAuthenticate({ id: 'u-1', status: 'ACTIVE' }),
      ).resolves.toBeUndefined();
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockGate.invalidate).not.toHaveBeenCalled();
      expect(mockEvents.emit).not.toHaveBeenCalled();
    });

    it('rejects DELETED user with generic 401 UnauthorizedException without status disclosure', async () => {
      await expect(
        service.assertCanAuthenticate({ id: 'u-deleted', status: 'DELETED' }),
      ).rejects.toThrow(UnauthorizedException);

      try {
        await service.assertCanAuthenticate({ id: 'u-deleted', status: 'DELETED' });
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.message).toBe('بيانات الدخول غير صحيحة');
        expect(err.getResponse()).not.toHaveProperty('code');
        expect(err.getResponse()).not.toHaveProperty('statusReason');
      }
    });

    it('rejects BANNED user with 403 ForbiddenException and ACCOUNT_BANNED code', async () => {
      try {
        await service.assertCanAuthenticate({ id: 'u-banned', status: 'BANNED' });
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getStatus()).toBe(403);
        const res = err.getResponse();
        expect(res).toEqual({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
        });
        expect(res).not.toHaveProperty('statusReason');
      }
    });

    it('rejects SUSPENDED user with null suspendedUntil (indefinite suspension) with 403 and null date', async () => {
      try {
        await service.assertCanAuthenticate({
          id: 'u-suspended',
          status: 'SUSPENDED',
          suspendedUntil: null,
        });
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getStatus()).toBe(403);
        const res = err.getResponse();
        expect(res).toEqual({
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
          suspendedUntil: null,
        });
      }
    });

    it('rejects SUSPENDED user with future suspendedUntil with 403 and ISO date string', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in future
      try {
        await service.assertCanAuthenticate({
          id: 'u-suspended',
          status: 'SUSPENDED',
          suspendedUntil: futureDate,
        });
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getStatus()).toBe(403);
        const res = err.getResponse();
        expect(res).toEqual({
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
          suspendedUntil: futureDate.toISOString(),
        });
      }
    });

    it('lazily lifts expired suspension when suspendedUntil <= now, invalidates gate, and emits event', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      const userInput = {
        id: 'u-expired',
        status: 'SUSPENDED',
        suspendedUntil: pastDate,
      };

      await expect(service.assertCanAuthenticate(userInput)).resolves.toBeUndefined();

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'u-expired',
          status: 'SUSPENDED',
          suspendedUntil: { lte: expect.any(Date) },
        },
        data: {
          status: 'ACTIVE',
          suspendedUntil: null,
          statusChangedAt: expect.any(Date),
        },
      });

      expect(mockGate.invalidate).toHaveBeenCalledWith('u-expired');
      expect(mockEvents.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({
          userId: 'u-expired',
          previousStatus: 'SUSPENDED',
          status: 'ACTIVE',
          suspendedUntil: null,
          at: expect.any(Date),
        } satisfies UserStatusChangedPayload),
      );

      // Verify in-memory state updated
      expect(userInput.status).toBe('ACTIVE');
      expect(userInput.suspendedUntil).toBeNull();
    });

    it('handles race condition gracefully when concurrent process already un-suspended user (updateMany count = 0)', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 }); // concurrent winner updated it first

      const userInput = {
        id: 'u-race',
        status: 'SUSPENDED',
        suspendedUntil: pastDate,
      };

      await expect(service.assertCanAuthenticate(userInput)).resolves.toBeUndefined();

      expect(mockPrisma.user.updateMany).toHaveBeenCalled();
      // Should NOT duplicate gate invalidation or event emission when count is 0
      expect(mockGate.invalidate).not.toHaveBeenCalled();
      expect(mockEvents.emit).not.toHaveBeenCalled();
      expect(userInput.status).toBe('ACTIVE');
    });

    it('rejects unknown status with generic 401 UnauthorizedException', async () => {
      await expect(
        service.assertCanAuthenticate({ id: 'u-unknown', status: 'UNKNOWN_STATUS' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('liftExpiredSuspensions (Cron Job)', () => {
    it('lifts expired suspensions for found users in batch, invalidating gate and emitting events', async () => {
      const pastDate = new Date(Date.now() - 5000);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-batch-1' },
        { id: 'u-batch-2' },
      ]);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      await service.liftExpiredSuspensions();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          status: 'SUSPENDED',
          suspendedUntil: { lte: expect.any(Date) },
        },
        select: { id: true },
        take: 500,
      });

      expect(mockPrisma.user.updateMany).toHaveBeenCalledTimes(2);
      expect(mockGate.invalidate).toHaveBeenCalledWith('u-batch-1');
      expect(mockGate.invalidate).toHaveBeenCalledWith('u-batch-2');
      expect(mockEvents.emit).toHaveBeenCalledTimes(2);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({
          userId: 'u-batch-1',
          previousStatus: 'SUSPENDED',
          status: 'ACTIVE',
          suspendedUntil: null,
          at: expect.any(Date),
        }),
      );
    });

    it('no-ops when no expired suspended users are found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.liftExpiredSuspensions();

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockGate.invalidate).not.toHaveBeenCalled();
      expect(mockEvents.emit).not.toHaveBeenCalled();
    });

    it('continues processing remaining users when one update fails, without throwing', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-fail' },
        { id: 'u-ok' },
      ]);

      mockPrisma.user.updateMany
        .mockRejectedValueOnce(new Error('DB connection glitch'))
        .mockResolvedValueOnce({ count: 1 });

      await expect(service.liftExpiredSuspensions()).resolves.toBeUndefined();

      // u-ok should still be processed
      expect(mockGate.invalidate).toHaveBeenCalledWith('u-ok');
      expect(mockEvents.emit).toHaveBeenCalledWith(
        USER_STATUS_CHANGED,
        expect.objectContaining({ userId: 'u-ok', status: 'ACTIVE' }),
      );
    });

    it('catches top-level errors and logs warning without throwing / crashing cron', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Fatal DB failure'));

      await expect(service.liftExpiredSuspensions()).resolves.toBeUndefined();
    });
  });
});
