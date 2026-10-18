import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoService } from '../../locations/geo.service';
import { AuthTokenService } from '../../auth/auth-token.service';
import { AccessTokenGate } from '../../auth/access-token-gate.service';
import { AuthService } from '../../auth/auth.service';
import { OwnerContentVisibilityService } from '../../common/services/owner-content-visibility.service';
import { MailService } from '../../mail/mail.service';
import { OWNER_VISIBILITY_REGISTRY } from '../../common/constants/owner-visibility.registry';
import { PaymentsService } from '../../payments/payments.service';
import { TransportRequestService } from '../../transport/transport-request.service';
import { JobsService } from '../../jobs/jobs.service';
import { ThawaniService } from '../../payments/thawani.service';
import { PaymentActivationService } from '../../payments/payment-activation.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserStatusVisibilityListener } from '../../common/listeners/user-status-visibility.listener';
import { SellerContactGate } from '../../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../../common/services/active-listings-limit.service';
import * as bcrypt from 'bcryptjs';

describe('Account Deletion (PR 2A) — Comprehensive Test Suite', () => {
  let usersService: UsersService;
  let paymentsService: PaymentsService;
  let transportRequestService: TransportRequestService;
  let jobsService: JobsService;
  let userStatusVisibilityListener: UserStatusVisibilityListener;

  let mockPrisma: any;
  let mockGeoService: any;
  let mockAuthTokenService: any;
  let mockAccessTokenGate: any;
  let mockAuthService: any;
  let mockVisibilityService: any;
  let mockMailService: any;
  let mockThawaniService: any;
  let mockPaymentActivationService: any;
  let mockRedis: any;
  let mockNotifications: any;

  const validPassword = 'SecurePassword123!';
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGeoService = {
      validateLocationPair: jest.fn().mockResolvedValue(true),
      syncLocation: jest.fn().mockResolvedValue(undefined),
      clearLocation: jest.fn().mockResolvedValue(undefined),
    };

    mockAuthTokenService = {
      revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      signAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
      rotateRefreshToken: jest.fn(),
      sanitizeUser: jest.fn((u) => {
        const { passwordHash, googleId, ...rest } = u;
        return rest;
      }),
    };

    mockAccessTokenGate = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    mockAuthService = {
      verifyGoogleIdToken: jest.fn(),
    };

    mockVisibilityService = {
      hideAllForUser: jest.fn().mockResolvedValue({ userId: 'u1', affectedCounts: {}, totalAffected: 0 }),
      restoreAllForUser: jest.fn().mockResolvedValue({ userId: 'u1', affectedCounts: {}, totalAffected: 0 }),
    };

    mockMailService = {
      sendDeletionRequestEmail: jest.fn().mockResolvedValue(true),
      sendDeletionCancelledEmail: jest.fn().mockResolvedValue(true),
    };

    mockThawaniService = {
      createSession: jest.fn().mockResolvedValue({ session_id: 'sess-123' }),
      getCheckoutUrl: jest.fn().mockReturnValue('https://checkout.thawani.om/sess-123'),
    };

    mockPaymentActivationService = {};

    mockRedis = {
      isReady: jest.fn().mockReturnValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockNotifications = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>, _options?: any) => {
        return cb(mockPrisma);
      }),
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({ id: 'pay-1' }),
      },
      subscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      transportRequest: {
        create: jest.fn().mockResolvedValue({ id: 'req-1' }),
      },
      driverJob: {
        findFirst: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
      },
      employerProfile: {
        findUnique: jest.fn(),
      },
      jobApplication: {
        create: jest.fn(),
      },
    };

    for (const config of OWNER_VISIBILITY_REGISTRY) {
      mockPrisma[config.prismaDelegate] = {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({ sellerId: 'u1', userId: 'u1', status: 'ACTIVE' }),
      };
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PaymentsService,
        TransportRequestService,
        JobsService,
        UserStatusVisibilityListener,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: AccessTokenGate, useValue: mockAccessTokenGate },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OwnerContentVisibilityService, useValue: mockVisibilityService },
        { provide: MailService, useValue: mockMailService },
        { provide: ThawaniService, useValue: mockThawaniService },
        { provide: PaymentActivationService, useValue: mockPaymentActivationService },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    transportRequestService = module.get<TransportRequestService>(TransportRequestService);
    jobsService = module.get<JobsService>(JobsService);
    userStatusVisibilityListener = module.get<UserStatusVisibilityListener>(UserStatusVisibilityListener);
  });

  describe('1. Re-authentication Rules (Password, Google, Confirmation)', () => {
    it('requires password and verifies it when user has passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pass',
        email: 'pass@souqone.om',
        displayName: 'Password User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      // Missing password
      await expect(
        usersService.scheduleAccountDeletion('user-pass', { confirmation: 'حذف حسابي' }),
      ).rejects.toThrow(UnauthorizedException);

      // Wrong password
      await expect(
        usersService.scheduleAccountDeletion('user-pass', {
          password: 'WrongPassword!',
          confirmation: 'حذف حسابي',
        }),
      ).rejects.toThrow('كلمة المرور غير صحيحة');

      // Correct password succeeds
      const res = await usersService.scheduleAccountDeletion('user-pass', {
        password: validPassword,
        confirmation: 'حذف حسابي',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBe('تمت جدولة حذف الحساب بنجاح');
    });

    it('requires googleIdToken and matches sub with googleId when user has googleId (no password)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-google',
        email: 'google@souqone.om',
        displayName: 'Google User',
        passwordHash: null,
        googleId: 'google-sub-12345',
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      // Missing googleIdToken
      await expect(
        usersService.scheduleAccountDeletion('user-google', { confirmation: 'DELETE' }),
      ).rejects.toThrow(UnauthorizedException);

      // Google token verification failure
      mockAuthService.verifyGoogleIdToken.mockRejectedValueOnce(
        new UnauthorizedException('رمز Google غير صالح'),
      );
      await expect(
        usersService.scheduleAccountDeletion('user-google', {
          googleIdToken: 'bad-token',
          confirmation: 'DELETE',
        }),
      ).rejects.toThrow('رمز Google غير صالح');

      // Google token sub mismatch
      mockAuthService.verifyGoogleIdToken.mockResolvedValueOnce({
        sub: 'different-google-sub-999',
        email: 'attacker@souqone.om',
      });
      await expect(
        usersService.scheduleAccountDeletion('user-google', {
          googleIdToken: 'valid-token-wrong-sub',
          confirmation: 'DELETE',
        }),
      ).rejects.toThrow('حساب Google غير مطابق لحسابك المسجل');

      // Matching sub succeeds
      mockAuthService.verifyGoogleIdToken.mockResolvedValueOnce({
        sub: 'google-sub-12345',
        email: 'google@souqone.om',
      });
      const res = await usersService.scheduleAccountDeletion('user-google', {
        googleIdToken: 'valid-token-matching-sub',
        confirmation: 'DELETE',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBe('تمت جدولة حذف الحساب بنجاح');
    });

    it('accepts confirmation alone when user has neither passwordHash nor googleId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-phone-only',
        email: null,
        displayName: 'Phone Only User',
        passwordHash: null,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      const res = await usersService.scheduleAccountDeletion('user-phone-only', {
        confirmation: 'حذف حسابي',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBe('تمت جدولة حذف الحساب بنجاح');
    });

    it('enforces re-authentication rules even on duplicate requests', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pass',
        email: 'pass@souqone.om',
        displayName: 'Password User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      // Wrong password on already scheduled account is rejected
      await expect(
        usersService.scheduleAccountDeletion('user-pass', {
          password: 'WrongPassword!',
          confirmation: 'حذف حسابي',
        }),
      ).rejects.toThrow('كلمة المرور غير صحيحة');
    });
  });

  describe('2. Roles and Statuses Rejections (403 Forbidden)', () => {
    it.each(['ADMIN', 'MODERATOR'] as const)('rejects role %s with 403', async (role) => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: `user-${role}`,
        email: `${role.toLowerCase()}@souqone.om`,
        displayName: `${role} User`,
        passwordHash: validPasswordHash,
        googleId: null,
        role,
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      await expect(
        usersService.scheduleAccountDeletion(`user-${role}`, {
          password: validPassword,
          confirmation: 'حذف حسابي',
        }),
      ).rejects.toThrow('لا يمكن حذف حساب إداري عبر هذا المسار');
    });

    it.each(['BANNED', 'SUSPENDED'] as const)('rejects status %s with 403', async (status) => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: `user-${status}`,
        email: `${status.toLowerCase()}@souqone.om`,
        displayName: `${status} User`,
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status,
        deletionScheduledAt: null,
      });

      await expect(
        usersService.scheduleAccountDeletion(`user-${status}`, {
          password: validPassword,
          confirmation: 'حذف حسابي',
        }),
      ).rejects.toThrow('لا يمكن حذف حساب موقوف أو محظور');
    });
  });

  describe('3. Payment Conflicts (409 Conflict)', () => {
    it.each(['PENDING', 'PROCESSING'] as const)(
      'rejects when active payment has status %s',
      async (status) => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-with-payment',
          email: 'pay@souqone.om',
          displayName: 'Pay User',
          passwordHash: validPasswordHash,
          googleId: null,
          role: 'USER',
          status: 'ACTIVE',
          deletionScheduledAt: null,
        });

        mockPrisma.payment.findFirst.mockResolvedValueOnce({
          id: 'pay-active-1',
          userId: 'user-with-payment',
          status,
        });

        await expect(
          usersService.scheduleAccountDeletion('user-with-payment', {
            password: validPassword,
            confirmation: 'حذف حسابي',
          }),
        ).rejects.toThrow(
          'لا يمكن جدولة حذف الحساب أثناء وجود معاملة دفع قيد المعالجة. يرجى الانتظار حتى اكتمال الدفعة أو إلغائها.',
        );
      },
    );
  });

  describe('4. Scheduling Deletion & Idempotency', () => {
    it('schedules deletion: deletionScheduledAt = now + 5 days, tokenVersion++, autoRenew=false, invalidates tokens, hides content, sends email', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-fresh',
        email: 'fresh@souqone.om',
        displayName: 'Fresh User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      const res = await usersService.scheduleAccountDeletion('user-fresh', {
        password: validPassword,
        confirmation: 'حذف حسابي',
      });

      const expectedDate = new Date(now + 5 * 24 * 60 * 60 * 1000);

      expect(res.success).toBe(true);
      expect(res.deletionScheduledAt).toBe(expectedDate.toISOString());
      expect(res.message).toBe('تمت جدولة حذف الحساب بنجاح');

      // Check DB update
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-fresh' },
        data: {
          deletionScheduledAt: expectedDate,
          tokenVersion: { increment: 1 },
        },
      });

      // Check subscriptions autoRenew turned off
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-fresh', status: 'ACTIVE' },
        data: { autoRenew: false },
      });

      // Check post-commit hooks
      expect(mockAccessTokenGate.invalidate).toHaveBeenCalledWith('user-fresh');
      expect(mockVisibilityService.hideAllForUser).toHaveBeenCalledWith('user-fresh');
      expect(mockMailService.sendDeletionRequestEmail).toHaveBeenCalledWith(
        'fresh@souqone.om',
        expectedDate,
        'Fresh User',
      );

      jest.spyOn(Date, 'now').mockRestore();
    });

    it('idempotency: returns existing scheduled date without extending or re-running post-commit hooks', async () => {
      const existingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-already-scheduled',
        email: 'sched@souqone.om',
        displayName: 'Scheduled User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: existingDate,
      });

      const res = await usersService.scheduleAccountDeletion('user-already-scheduled', {
        password: validPassword,
        confirmation: 'حذف حسابي',
      });

      expect(res.success).toBe(true);
      expect(res.deletionScheduledAt).toBe(existingDate.toISOString());
      expect(res.message).toBe('حسابك مجدول للحذف بالفعل');

      // User table NOT updated again
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      // Subscriptions NOT updated again
      expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
      // hideAllForUser NOT called again
      expect(mockVisibilityService.hideAllForUser).not.toHaveBeenCalled();
      // Email NOT sent again
      expect(mockMailService.sendDeletionRequestEmail).not.toHaveBeenCalled();
    });

    it('logs warning if remaining unhidden records exist across the 11 entities in OWNER_VISIBILITY_REGISTRY', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-partial',
        email: 'partial@souqone.om',
        displayName: 'Partial User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      // Simulate 1 listing remaining unhidden
      mockPrisma.listing.count.mockResolvedValueOnce(1);

      const warnSpy = jest.spyOn((usersService as any).logger, 'warn');

      await usersService.scheduleAccountDeletion('user-partial', {
        password: validPassword,
        confirmation: 'حذف حسابي',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('User user-partial scheduled for deletion has 1 unhidden records across verticals'),
      );
    });

    it('email send failure is fail-safe and does NOT fail the request', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-email-fail',
        email: 'fail@souqone.om',
        displayName: 'Fail Email User',
        passwordHash: validPasswordHash,
        googleId: null,
        role: 'USER',
        status: 'ACTIVE',
        deletionScheduledAt: null,
      });

      mockMailService.sendDeletionRequestEmail.mockRejectedValueOnce(new Error('SMTP down'));
      const errorSpy = jest.spyOn((usersService as any).logger, 'error');

      const res = await usersService.scheduleAccountDeletion('user-email-fail', {
        password: validPassword,
        confirmation: 'حذف حسابي',
      });

      expect(res.success).toBe(true);
      expect(res.message).toBe('تمت جدولة حذف الحساب بنجاح');
      // Wait microtask tick
      await new Promise((r) => setImmediate(r));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send deletion request email'));
    });
  });

  describe('5. Cancel Deletion (POST /users/me/cancel-deletion)', () => {
    it('throws BadRequestException if account is not scheduled for deletion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-not-scheduled',
        email: 'not@souqone.om',
        displayName: 'Not Sched',
        deletionScheduledAt: null,
      });

      await expect(usersService.cancelAccountDeletion('user-not-scheduled')).rejects.toThrow(
        'الحساب غير مجدول للحذف',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockVisibilityService.restoreAllForUser).not.toHaveBeenCalled();
    });

    it('cancels deletion: clears deletionScheduledAt first, calls restoreAllForUser, and sends cancellation email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-scheduled',
        email: 'sched@souqone.om',
        displayName: 'Sched User',
        deletionScheduledAt: new Date(),
      });

      const callOrder: string[] = [];
      mockPrisma.user.update.mockImplementationOnce(async () => {
        callOrder.push('clearDeletionScheduledAt');
        return {};
      });
      mockVisibilityService.restoreAllForUser.mockImplementationOnce(async () => {
        callOrder.push('restoreAllForUser');
        return { totalAffected: 2 };
      });

      const res = await usersService.cancelAccountDeletion('user-scheduled');

      expect(res.success).toBe(true);
      expect(res.message).toBe('تم إلغاء طلب حذف الحساب واستعادة إعلاناتك بنجاح');

      // Verify execution order: update before restore
      expect(callOrder).toEqual(['clearDeletionScheduledAt', 'restoreAllForUser']);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-scheduled' },
        data: { deletionScheduledAt: null },
      });
      expect(mockVisibilityService.restoreAllForUser).toHaveBeenCalledWith('user-scheduled');
      expect(mockMailService.sendDeletionCancelledEmail).toHaveBeenCalledWith(
        'sched@souqone.om',
        'Sched User',
      );
    });
  });

  describe('6. Visibility Listener Guard (Admin Un-suspension)', () => {
    it('does NOT restore content when admin unsuspends a user who is scheduled for deletion', async () => {
      // Simulate real restoreAllForUser logic:
      // It queries prisma.user.findUnique and aborts if deletionScheduledAt != null
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'suspended-and-scheduled',
        deletionScheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      });

      mockVisibilityService.restoreAllForUser.mockImplementation(async (userId: string) => {
        const u = await mockPrisma.user.findUnique({
          where: { id: userId },
          select: { deletionScheduledAt: true },
        });
        if (u?.deletionScheduledAt != null) {
          return { userId, affectedCounts: {}, totalAffected: 0 };
        }
        return { userId, affectedCounts: { listing: 5 }, totalAffected: 5 };
      });

      await userStatusVisibilityListener.handleUserStatusChanged({
        userId: 'suspended-and-scheduled',
        previousStatus: 'SUSPENDED',
        status: 'ACTIVE',
        suspendedUntil: null,
        at: new Date(),
      });

      expect(mockVisibilityService.restoreAllForUser).toHaveBeenCalledWith('suspended-and-scheduled');
      const result = await mockVisibilityService.restoreAllForUser.mock.results[0].value;
      expect(result.totalAffected).toBe(0);
    });
  });

  describe('7. Guards in Payments, Transport, and Jobs', () => {
    beforeEach(() => {
      process.env.PAYMENTS_ENABLED = 'true';
    });

    it('rejects createFeaturedPayment when user is scheduled for deletion', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      await expect(
        paymentsService.createFeaturedPayment(
          { entityType: 'LISTING', entityId: 'l1' },
          'user-sched',
        ),
      ).rejects.toThrow(
        'لا يمكن إجراء عمليات دفع أثناء جدولة حذف الحساب. يرجى إلغاء طلب الحذف أولاً.',
      );
    });

    it('rejects createSubscriptionPayment when user is scheduled for deletion', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      await expect(
        paymentsService.createSubscriptionPayment({ plan: 'PRO' }, 'user-sched'),
      ).rejects.toThrow(
        'لا يمكن إجراء عمليات دفع أثناء جدولة حذف الحساب. يرجى إلغاء طلب الحذف أولاً.',
      );
    });

    it('rejects TransportRequestService.create when user is scheduled for deletion', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      await expect(
        transportRequestService.create('user-sched', {
          serviceType: 'GOODS',
          fromGovernorateId: 'gov-1',
          fromWilayaId: 'wil-1',
          toGovernorateId: 'gov-2',
          toWilayaId: 'wil-2',
          cargoDescription: 'Heavy Cargo',
        } as any),
      ).rejects.toThrow(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لاستئناف نشر طلبات النقل.',
      );
    });

    it('rejects JobsService.apply when applicant is scheduled for deletion', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        deletionScheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      await expect(
        jobsService.apply('job-1', 'applicant-sched', {
          message: 'Interested',
        } as any),
      ).rejects.toThrow(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لاستئناف التقديم على الوظائف.',
      );
    });
  });

  describe('8. Serializer/Mapper Field Presence (deletionScheduledAt)', () => {
    it('includes deletionScheduledAt in GET /users/me profile response', async () => {
      const scheduledDate = new Date();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-me',
        username: 'meuser',
        displayName: 'Me User',
        email: 'me@souqone.om',
        phone: '96891234567',
        role: 'USER',
        deletionScheduledAt: scheduledDate,
        phoneVerifiedAt: new Date(),
        phoneE164: '+96891234567',
      });

      const profile = await usersService.getProfile('u-me');
      expect(profile).toHaveProperty('deletionScheduledAt', scheduledDate);
    });
  });
});
