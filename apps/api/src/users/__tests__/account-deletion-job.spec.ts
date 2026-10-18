import { Test, TestingModule } from '@nestjs/testing';
import {
  AccountStatus,
  PaymentStatus,
  Prisma,
  QuoteStatus,
  SubscriptionStatus,
  TransportRequestStatus,
  UserRole,
} from '@prisma/client';
import {
  AccountDeletionJob,
  ACCOUNT_DELETION_LOCK_KEY,
  ACCOUNT_DELETION_LOCK_TTL,
  ACCOUNT_DELETION_TX_CONFIG,
  ENTITY_ANONYMIZATION_PAYLOADS,
} from '../account-deletion.job';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OwnerContentVisibilityService } from '../../common/services/owner-content-visibility.service';
import { OWNER_VISIBILITY_REGISTRY } from '../../common/constants/owner-visibility.registry';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { MailService } from '../../mail/mail.service';
import { AccessTokenGate } from '../../auth/access-token-gate.service';
import { UsersModule } from '../users.module';

describe('AccountDeletionJob (PR 2B Unit Tests)', () => {
  let job: AccountDeletionJob;
  let mockPrisma: any;
  let mockRedis: any;
  let mockVisibility: any;
  let mockCloudinary: any;
  let mockMail: any;
  let mockGate: any;
  let txMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    txMock = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      authIdentity: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      otpChallenge: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      pushToken: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      pushSubscription: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      favorite: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      notification: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      listing: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      busListing: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      equipmentListing: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      operatorListing: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      sparePart: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      carService: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      driverJob: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      driverProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      employerProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      carrierProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'carrier-123' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      transportRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      driverVerification: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      listingImage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      busListingImage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      equipmentListingImage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      sparePartImage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      carServiceImage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      jobApplication: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      review: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      loginAudit: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      transportQuote: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      subscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    mockPrisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      payment: {
        count: jest.fn().mockResolvedValue(0),
      },
      operatorListing: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      listingImage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      busListingImage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      equipmentListingImage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      sparePartImage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      carServiceImage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      driverVerification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      message: {
        count: jest.fn().mockResolvedValue(0),
      },
      jobApplication: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (cb: any, _config?: any) => {
        return cb(txMock);
      }),
    };

    mockRedis = {
      isReady: jest.fn().mockReturnValue(true),
      setNX: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockVisibility = {
      hideAllForUser: jest.fn().mockResolvedValue({ totalAffected: 0 }),
    };

    mockCloudinary = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockMail = {
      sendFinalDeletionEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockGate = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionJob,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: OwnerContentVisibilityService, useValue: mockVisibility },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: MailService, useValue: mockMail },
        { provide: AccessTokenGate, useValue: mockGate },
      ],
    }).compile();

    job = module.get<AccountDeletionJob>(AccountDeletionJob);
  });

  describe('Redis Locking and Concurrency', () => {
    it('skips run quietly when Redis lock cannot be acquired (lockedOut: true)', async () => {
      mockRedis.setNX.mockResolvedValue(false);

      const result = await job.runAccountDeletion();

      expect(result.lockedOut).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('acquires lock with correct key and TTL, and releases lock in finally block', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await job.runAccountDeletion();

      expect(mockRedis.setNX).toHaveBeenCalledWith(
        ACCOUNT_DELETION_LOCK_KEY,
        '1',
        ACCOUNT_DELETION_LOCK_TTL,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(ACCOUNT_DELETION_LOCK_KEY);
      expect(result.lockedOut).toBeFalsy();
    });

    it('releases lock even when candidate processing throws an error', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database exploded'));

      await expect(job.runAccountDeletion()).rejects.toThrow('Database exploded');

      expect(mockRedis.del).toHaveBeenCalledWith(ACCOUNT_DELETION_LOCK_KEY);
    });

    it('proceeds cautiously without lock if Redis is not ready', async () => {
      mockRedis.isReady.mockReturnValue(false);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await job.runAccountDeletion();

      expect(mockRedis.setNX).not.toHaveBeenCalled();
      expect(result.processedCount).toBe(0);
    });
  });

  describe('Pre-Processing Checks', () => {
    const candidateBase = {
      id: 'user-cand-1',
      email: 'cand@example.com',
      displayName: 'مرشح للحذف',
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
      deletionScheduledAt: new Date(Date.now() - 1000),
      avatarUrl: null,
    };

    it('aborts schedule for non-ACTIVE user (clears deletionScheduledAt, skips tx)', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ ...candidateBase, status: AccountStatus.SUSPENDED }])
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.abortedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: candidateBase.id, deletionScheduledAt: { not: null } },
        data: { deletionScheduledAt: null },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockVisibility.hideAllForUser).not.toHaveBeenCalled();
    });

    it('aborts schedule for ADMIN user (clears deletionScheduledAt, skips tx)', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ ...candidateBase, role: UserRole.ADMIN }])
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.abortedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: candidateBase.id, deletionScheduledAt: { not: null } },
        data: { deletionScheduledAt: null },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('aborts schedule for MODERATOR user (clears deletionScheduledAt, skips tx)', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ ...candidateBase, role: UserRole.MODERATOR }])
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.abortedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: candidateBase.id, deletionScheduledAt: { not: null } },
        data: { deletionScheduledAt: null },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('skips user with PENDING or PROCESSING payment without clearing schedule', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidateBase])
        .mockResolvedValueOnce([]);
      mockPrisma.payment.count.mockResolvedValue(1);

      const result = await job.runAccountDeletion();

      expect(result.skippedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(mockPrisma.payment.count).toHaveBeenCalledWith({
        where: {
          userId: candidateBase.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        },
      });
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled(); // schedule is NOT cleared
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('calls hideAllForUser with retry logic before entering transaction', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidateBase])
        .mockResolvedValueOnce([]);
      mockVisibility.hideAllForUser
        .mockRejectedValueOnce(new Error('Transient failure'))
        .mockResolvedValueOnce({ totalAffected: 1 });

      await job.runAccountDeletion();

      expect(mockVisibility.hideAllForUser).toHaveBeenCalledTimes(2);
      expect(mockVisibility.hideAllForUser).toHaveBeenCalledWith(candidateBase.id);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('skips candidate if hideAllForUser fails all 3 attempts without transaction or clearing schedule', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidateBase])
        .mockResolvedValueOnce([]);
      mockVisibility.hideAllForUser.mockRejectedValue(new Error('Persistent visibility failure'));

      const result = await job.runAccountDeletion();

      expect(result.skippedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(mockVisibility.hideAllForUser).toHaveBeenCalledTimes(3);
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('isolates candidate errors so an unexpected exception on one candidate does not block the next and increments failedCount', async () => {
      const candidate1 = { ...candidateBase, id: 'cand-err-1', email: 'err1@example.com' };
      const candidate2 = { ...candidateBase, id: 'cand-ok-2', email: 'ok2@example.com' };

      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate1, candidate2])
        .mockResolvedValueOnce([]);

      // Make candidate1 fail unexpectedly during operatorListing query
      mockPrisma.operatorListing.findMany
        .mockRejectedValueOnce(new Error('Database network blip'))
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.failedCount).toBe(1);
      expect(result.processedCount).toBe(1);
    });
  });

  describe('CAS Update & Concurrency in Transaction', () => {
    const candidate = {
      id: 'user-cas-1',
      email: 'cas@example.com',
      displayName: 'مستخدم CAS',
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
      deletionScheduledAt: new Date(Date.now() - 5000),
      avatarUrl: null,
    };

    it('skips all transaction writes and post-commit hooks if CAS count is 0', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate])
        .mockResolvedValueOnce([]);
      txMock.user.updateMany.mockResolvedValue({ count: 0 }); // CAS failed

      const result = await job.runAccountDeletion();

      expect(result.skippedCount).toBe(1);
      expect(result.processedCount).toBe(0);

      // CAS was attempted
      expect(txMock.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: candidate.id,
          deletionScheduledAt: { lte: expect.any(Date) },
          status: AccountStatus.ACTIVE,
        },
        data: { status: AccountStatus.DELETED },
      });

      // NO other writes executed
      expect(txMock.user.update).not.toHaveBeenCalled();
      expect(txMock.authIdentity.deleteMany).not.toHaveBeenCalled();
      expect(txMock.listing.updateMany).not.toHaveBeenCalled();
      expect(mockGate.invalidate).not.toHaveBeenCalled();
      expect(mockMail.sendFinalDeletionEmail).not.toHaveBeenCalled();
    });

    it('calls $transaction with exact configuration { maxWait: 15000, timeout: 20000 }', async () => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate])
        .mockResolvedValueOnce([]);

      await job.runAccountDeletion();

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        ACCOUNT_DELETION_TX_CONFIG,
      );
      expect(ACCOUNT_DELETION_TX_CONFIG).toEqual({ maxWait: 15000, timeout: 20000 });
    });
  });

  describe('Data Anonymization and Deletion Matrix', () => {
    const candidate = {
      id: 'user-full-123456',
      email: 'full@example.com',
      displayName: 'أحمد البلوشي',
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
      deletionScheduledAt: new Date(Date.now() - 10000),
      avatarUrl: 'https://res.cloudinary.com/carone/image/upload/v123/avatars/user.jpg',
    };

    beforeEach(() => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate])
        .mockResolvedValueOnce([]);
    });

    it('anonymizes User record with PII nullification, placeholder name, and incremented tokenVersion', async () => {
      await job.runAccountDeletion();

      expect(txMock.user.update).toHaveBeenCalledWith({
        where: { id: candidate.id },
        data: expect.objectContaining({
          email: null,
          phone: null,
          phoneE164: null,
          googleId: null,
          passwordHash: null,
          avatarUrl: null,
          bio: null,
          country: null,
          governorate: null,
          city: null,
          governorateId: null,
          wilayaId: null,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
          passwordResetCode: null,
          passwordResetExpiry: null,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
          statusReason: null,
          suspendedUntil: null,
          statusChangedById: null,
          isVerified: false,
          displayName: 'مستخدم محذوف',
          username: expect.stringMatching(/^deleted_\d+_123456$/),
          deletedAt: expect.any(Date),
          deletionScheduledAt: null,
          tokenVersion: { increment: 1 },
        }),
      });
    });

    it('deletes child rows from auxiliary tables', async () => {
      await job.runAccountDeletion();

      expect(txMock.authIdentity.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.otpChallenge.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.pushToken.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
      expect(txMock.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: candidate.id } });
    });

    it('wipes listing image table rows without deleting parent listings', async () => {
      await job.runAccountDeletion();

      expect(txMock.listingImage.deleteMany).toHaveBeenCalledWith({
        where: { listing: { sellerId: candidate.id } },
      });
      expect(txMock.busListingImage.deleteMany).toHaveBeenCalledWith({
        where: { busListing: { userId: candidate.id } },
      });
      expect(txMock.equipmentListingImage.deleteMany).toHaveBeenCalledWith({
        where: { equipmentListing: { userId: candidate.id } },
      });
      expect(txMock.sparePartImage.deleteMany).toHaveBeenCalledWith({
        where: { sparePart: { sellerId: candidate.id } },
      });
      expect(txMock.carServiceImage.deleteMany).toHaveBeenCalledWith({
        where: { carService: { userId: candidate.id } },
      });
    });

    it('anonymizes JobApplication, Review, Payment, and LoginAudit', async () => {
      await job.runAccountDeletion();

      expect(txMock.jobApplication.updateMany).toHaveBeenCalledWith({
        where: { applicantId: candidate.id },
        data: { resumeUrl: null, message: null },
      });

      expect(txMock.review.updateMany).toHaveBeenCalledWith({
        where: { reviewerId: candidate.id },
        data: { comment: '[تم حذف التعليق من قبل المستخدم]' },
      });

      expect(txMock.payment.updateMany).toHaveBeenCalledWith({
        where: { userId: candidate.id },
        data: { ipAddress: null, metadata: Prisma.DbNull },
      });

      expect(txMock.loginAudit.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: candidate.id }, { email: candidate.email }],
        },
        data: {
          email: '[DELETED]',
          userId: null,
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('withdraws pending quotes, cancels open/quoted requests, and cancels subscription', async () => {
      await job.runAccountDeletion();

      expect(txMock.carrierProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: candidate.id },
        select: { id: true },
      });

      expect(txMock.transportQuote.updateMany).toHaveBeenCalledWith({
        where: { carrierId: 'carrier-123', status: QuoteStatus.PENDING },
        data: { status: QuoteStatus.WITHDRAWN },
      });

      expect(txMock.transportRequest.updateMany).toHaveBeenCalledWith({
        where: {
          userId: candidate.id,
          status: { in: [TransportRequestStatus.OPEN, TransportRequestStatus.QUOTED] },
        },
        data: { status: TransportRequestStatus.CANCELLED },
      });

      expect(txMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { userId: candidate.id },
        data: { autoRenew: false, status: SubscriptionStatus.CANCELLED },
      });
    });
  });

  describe('Table-Driven Anonymization Matrix across OWNER_VISIBILITY_REGISTRY', () => {
    it('executes updateMany on all 11 entities in OWNER_VISIBILITY_REGISTRY with exact required payloads and correct owner field', async () => {
      const candidate = {
        id: 'user-registry-all',
        email: 'all@example.com',
        displayName: 'مستخدم مسجل',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        deletionScheduledAt: new Date(Date.now() - 1000),
      };

      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate])
        .mockResolvedValueOnce([]);

      await job.runAccountDeletion();

      expect(OWNER_VISIBILITY_REGISTRY).toHaveLength(11);

      for (const config of OWNER_VISIBILITY_REGISTRY) {
        const delegate = txMock[config.prismaDelegate];
        const expectedPayload = (ENTITY_ANONYMIZATION_PAYLOADS as any)[config.prismaDelegate];

        expect(expectedPayload).toBeDefined();
        expect(delegate.updateMany).toHaveBeenCalledWith({
          where: { [config.ownerField]: candidate.id },
          data: expectedPayload,
        });
      }
    });
  });

  describe('Cloudinary & Post-Commit Hooks', () => {
    const candidate = {
      id: 'user-media-1',
      email: 'media@example.com',
      displayName: 'سالم الكعبي',
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
      deletionScheduledAt: new Date(Date.now() - 1000),
      avatarUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/users/avatar.jpg',
    };

    beforeEach(() => {
      mockPrisma.user.findMany
        .mockResolvedValueOnce([candidate])
        .mockResolvedValueOnce([]);

      mockPrisma.operatorListing.findMany.mockResolvedValue([
        { profileImageUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/ops/operator.png' },
      ]);
      mockPrisma.listingImage.findMany.mockResolvedValue([
        { url: 'https://res.cloudinary.com/carone/image/upload/v12345/listings/car1.jpg' },
        { url: '/uploads/local-image.jpg' }, // local, non-Cloudinary -> ignored
      ]);
      mockPrisma.busListingImage.findMany.mockResolvedValue([
        { url: 'https://res.cloudinary.com/carone/image/upload/v12345/bus/bus1.webp' },
      ]);
      mockPrisma.equipmentListingImage.findMany.mockResolvedValue([]);
      mockPrisma.sparePartImage.findMany.mockResolvedValue([
        { url: 'https://res.cloudinary.com/carone/image/upload/v12345/parts/part1.jpg' },
      ]);
      mockPrisma.carServiceImage.findMany.mockResolvedValue([]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { resumeUrl: 'https://res.cloudinary.com/carone/raw/upload/v12345/resumes/cv.pdf' },
      ]);
    });

    it('collects Cloudinary public IDs and deletes them via CloudinaryService.delete after commit', async () => {
      await job.runAccountDeletion();

      expect(mockCloudinary.delete).toHaveBeenCalledWith('users/avatar');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('ops/operator');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('listings/car1');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('bus/bus1');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('parts/part1');
      expect(mockCloudinary.delete).not.toHaveBeenCalledWith('resumes/cv');
      expect(mockCloudinary.delete).not.toHaveBeenCalledWith(expect.stringContaining('local-image'));
    });

    it('is best-effort: failure of one Cloudinary deletion does not stop others or fail the job', async () => {
      mockCloudinary.delete.mockRejectedValueOnce(new Error('Cloudinary timeout'));

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockCloudinary.delete).toHaveBeenCalledTimes(5);
    });

    it('does not delete Cloudinary asset if still referenced by another record, and deletes unshared asset', async () => {
      // Mock listingImage.count to return 1 for listings/car1 (shared) and 0 for others
      mockPrisma.listingImage.count.mockImplementation(async ({ where }: any) => {
        if (where?.url?.contains === 'listings/car1') {
          return 1;
        }
        return 0;
      });

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      // listings/car1 is shared, so must NOT be deleted
      expect(mockCloudinary.delete).not.toHaveBeenCalledWith('listings/car1');
      // unshared ones ARE deleted
      expect(mockCloudinary.delete).toHaveBeenCalledWith('users/avatar');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('ops/operator');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('bus/bus1');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('parts/part1');
    });

    it('skips deletion of Cloudinary asset if reference check throws an error (fail-safe) without failing the job', async () => {
      mockPrisma.listingImage.count.mockRejectedValue(new Error('DB read error during reference check'));

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      // Because reference check failed, CloudinaryService.delete was not invoked
      expect(mockCloudinary.delete).not.toHaveBeenCalled();
    });

    it('never deletes JobApplication.resumeUrl from Cloudinary even if it contains a Cloudinary URL', async () => {
      // Only job application has a Cloudinary URL, avatar is null, all listing images are empty
      mockPrisma.user.findMany.mockReset();
      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ ...candidate, avatarUrl: null }])
        .mockResolvedValueOnce([]);
      mockPrisma.operatorListing.findMany.mockResolvedValue([]);
      mockPrisma.listingImage.findMany.mockResolvedValue([]);
      mockPrisma.busListingImage.findMany.mockResolvedValue([]);
      mockPrisma.sparePartImage.findMany.mockResolvedValue([]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { resumeUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/resumes/applicant.pdf' },
      ]);

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockCloudinary.delete).not.toHaveBeenCalled();
    });

    it('invalidates accessTokenGate and sends final deletion email after successful commit', async () => {
      await job.runAccountDeletion();

      expect(mockGate.invalidate).toHaveBeenCalledWith(candidate.id);
      expect(mockMail.sendFinalDeletionEmail).toHaveBeenCalledWith(
        candidate.email,
        candidate.displayName,
      );
    });

    it('does not fail job if sending final deletion email throws an error', async () => {
      mockMail.sendFinalDeletionEmail.mockRejectedValueOnce(new Error('SMTP connection error'));

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockGate.invalidate).toHaveBeenCalledWith(candidate.id);
    });

    it('does not delete Cloudinary asset if referenced in Message.mediaUrl', async () => {
      mockPrisma.message.count.mockImplementation(async ({ where }: any) => {
        if (where?.mediaUrl?.contains === 'users/avatar') {
          return 1;
        }
        return 0;
      });

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockCloudinary.delete).not.toHaveBeenCalledWith('users/avatar');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('listings/car1');
    });

    it('does not delete Cloudinary asset if referenced in another user DriverVerification', async () => {
      mockPrisma.driverVerification.count.mockImplementation(async ({ where }: any) => {
        const orConditions = where?.OR || [];
        const hasMatch = orConditions.some(
          (cond: any) =>
            cond.licenseImageUrl?.contains === 'ops/operator' ||
            cond.licenseBackImageUrl?.contains === 'ops/operator' ||
            cond.idImageUrl?.contains === 'ops/operator' ||
            cond.idBackImageUrl?.contains === 'ops/operator',
        );
        return hasMatch ? 1 : 0;
      });

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockCloudinary.delete).not.toHaveBeenCalledWith('ops/operator');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('users/avatar');
    });

    it('collects all 4 DriverVerification URLs, deletes DriverVerification in tx, and deletes assets from Cloudinary', async () => {
      mockPrisma.driverVerification.findMany.mockResolvedValue([
        {
          licenseImageUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/drivers/license_front.jpg',
          licenseBackImageUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/drivers/license_back.jpg',
          idImageUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/drivers/id_front.jpg',
          idBackImageUrl: 'https://res.cloudinary.com/carone/image/upload/v12345/drivers/id_back.jpg',
        },
      ]);

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(txMock.driverVerification.deleteMany).toHaveBeenCalledWith({
        where: { driverProfile: { userId: candidate.id } },
      });
      expect(mockCloudinary.delete).toHaveBeenCalledWith('drivers/license_front');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('drivers/license_back');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('drivers/id_front');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('drivers/id_back');
    });

    it('continues email sending and Cloudinary deletion when accessTokenGate.invalidate throws an error without failing the job', async () => {
      mockGate.invalidate.mockRejectedValueOnce(new Error('Redis connection lost'));

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(mockMail.sendFinalDeletionEmail).toHaveBeenCalledWith(
        candidate.email,
        candidate.displayName,
      );
      expect(mockCloudinary.delete).toHaveBeenCalledWith('users/avatar');
    });

    it('never logs originalEmail, displayName, or phone even when email sending fails', async () => {
      const warnSpy = jest.spyOn(job['logger'], 'warn');
      const errorSpy = jest.spyOn(job['logger'], 'error');
      const logSpy = jest.spyOn(job['logger'], 'log');
      const debugSpy = jest.spyOn(job['logger'], 'debug');

      mockMail.sendFinalDeletionEmail.mockRejectedValueOnce(new Error('SMTP connection timed out'));

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to send final deletion email for user ${candidate.id}`),
      );

      const allLoggedMessages: string[] = [
        ...warnSpy.mock.calls.map((c) => String(c[0])),
        ...errorSpy.mock.calls.map((c) => String(c[0])),
        ...logSpy.mock.calls.map((c) => String(c[0])),
        ...debugSpy.mock.calls.map((c) => String(c[0])),
      ];

      for (const msg of allLoggedMessages) {
        expect(msg).not.toContain(candidate.email);
        expect(msg).not.toContain(candidate.displayName);
      }
    });

    it('skips sending email if candidate has no email', async () => {
      mockPrisma.user.findMany.mockReset();
      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ ...candidate, email: null }])
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(1);
      expect(mockMail.sendFinalDeletionEmail).not.toHaveBeenCalled();
      expect(mockGate.invalidate).toHaveBeenCalledWith(candidate.id);
    });
  });

  describe('Batch Processing', () => {
    it('processes candidates in batches and stops when candidate list is empty', async () => {
      const batch1 = Array.from({ length: 50 }, (_, i) => ({
        id: `u-b1-${i}`,
        email: `u1_${i}@example.com`,
        displayName: `User 1-${i}`,
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        deletionScheduledAt: new Date(Date.now() - 1000),
        avatarUrl: null,
      }));

      const batch2 = Array.from({ length: 10 }, (_, i) => ({
        id: `u-b2-${i}`,
        email: `u2_${i}@example.com`,
        displayName: `User 2-${i}`,
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        deletionScheduledAt: new Date(Date.now() - 1000),
        avatarUrl: null,
      }));

      mockPrisma.user.findMany
        .mockResolvedValueOnce(batch1)
        .mockResolvedValueOnce(batch2)
        .mockResolvedValueOnce([]);

      const result = await job.runAccountDeletion();

      expect(result.processedCount).toBe(60);
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(3);
    });
  });

  describe('UsersModule Integration', () => {
    it('successfully boots UsersModule and provides AccountDeletionJob', async () => {
      const { EventEmitterModule } = await import('@nestjs/event-emitter');
      const { ScheduleModule } = await import('@nestjs/schedule');

      const moduleRef = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot(), ScheduleModule.forRoot(), UsersModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma)
        .overrideProvider(RedisService)
        .useValue(mockRedis)
        .compile();

      const jobInstance = moduleRef.get<AccountDeletionJob>(AccountDeletionJob);
      expect(jobInstance).toBeDefined();
      expect(jobInstance).toBeInstanceOf(AccountDeletionJob);
    });
  });
});
