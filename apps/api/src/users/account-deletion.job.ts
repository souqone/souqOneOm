import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AccountStatus,
  PaymentStatus,
  Prisma,
  QuoteStatus,
  SubscriptionStatus,
  TransportRequestStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OwnerContentVisibilityService } from '../common/services/owner-content-visibility.service';
import { OWNER_VISIBILITY_REGISTRY } from '../common/constants/owner-visibility.registry';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import { extractCloudinaryPublicId } from '../common/utils/cloudinary-url.util';

export const ACCOUNT_DELETION_LOCK_KEY = 'lock:account-deletion';
export const ACCOUNT_DELETION_LOCK_TTL = 600; // 10 minutes in seconds
export const ACCOUNT_DELETION_BATCH_SIZE = 50;
export const ACCOUNT_DELETION_MAX_BATCHES = 10;
export const ACCOUNT_DELETION_TX_CONFIG = { maxWait: 15000, timeout: 20000 };

export const ENTITY_ANONYMIZATION_PAYLOADS = {
  listing: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    latitude: null,
    longitude: null,
    whatsappEnabled: false,
  },
  busListing: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    plateNumber: null,
    latitude: null,
    longitude: null,
    whatsappEnabled: false,
  },
  equipmentListing: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
    latitude: null,
    longitude: null,
    siteDetails: null,
  },
  operatorListing: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
    latitude: null,
    longitude: null,
    profileImageUrl: null,
  },
  sparePart: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
    latitude: null,
    longitude: null,
  },
  carService: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    address: null,
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
    website: null,
    latitude: null,
    longitude: null,
  },
  driverJob: {
    description: '[تم حذف التفاصيل بواسطة المستخدم]',
    contactPhone: null,
    contactEmail: null,
    whatsapp: null,
    whatsappEnabled: false,
  },
  driverProfile: {
    bio: null,
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
  },
  employerProfile: {
    bio: null,
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
  },
  carrierProfile: {
    bio: null,
    contactPhone: null,
    whatsapp: null,
    whatsappEnabled: false,
  },
  transportRequest: {
    cargoDescription: '[تم حذف التفاصيل بواسطة المستخدم]',
    notes: null,
    fromAddress: '[تم حذف العنوان]',
    fromLat: null,
    fromLng: null,
    fromLatitude: null,
    fromLongitude: null,
    toAddress: '[تم حذف العنوان]',
    toLat: null,
    toLng: null,
    toLatitude: null,
    toLongitude: null,
  },
} as const;

@Injectable()
export class AccountDeletionJob {
  private readonly logger = new Logger(AccountDeletionJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly visibilityService: OwnerContentVisibilityService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
    private readonly accessTokenGate: AccessTokenGate,
  ) {}

  /**
   * Periodic account deletion execution job. Runs every 15 minutes.
   * Acquires a Redis lock for 600s to prevent overlapping runs across replicas.
   */
  @Cron('*/15 * * * *')
  async runAccountDeletion(): Promise<{
    processedCount: number;
    skippedCount: number;
    abortedCount: number;
    lockedOut?: boolean;
  }> {
    let lockAcquired = false;

    if (this.redisService.isReady()) {
      lockAcquired = await this.redisService.setNX(
        ACCOUNT_DELETION_LOCK_KEY,
        '1',
        ACCOUNT_DELETION_LOCK_TTL,
      );

      if (!lockAcquired) {
        this.logger.debug('Account deletion job already running on another replica. Skipping cycle.');
        return { processedCount: 0, skippedCount: 0, abortedCount: 0, lockedOut: true };
      }
    } else {
      this.logger.warn(
        'Redis is not ready for account deletion lock. Proceeding cautiously with database transactions.',
      );
    }

    let processedCount = 0;
    let skippedCount = 0;
    let abortedCount = 0;
    const handledCandidateIds = new Set<string>();

    try {
      this.logger.log('Starting account deletion execution job...');

      for (let batch = 1; batch <= ACCOUNT_DELETION_MAX_BATCHES; batch++) {
        const now = new Date();
        const candidates = await this.prisma.user.findMany({
          where: {
            deletionScheduledAt: { lte: now },
            id: { notIn: Array.from(handledCandidateIds) },
          },
          orderBy: { deletionScheduledAt: 'asc' },
          take: ACCOUNT_DELETION_BATCH_SIZE,
        });

        if (candidates.length === 0) {
          break;
        }

        for (const candidate of candidates) {
          handledCandidateIds.add(candidate.id);

          // 2(a) Pre-check: If status !== ACTIVE or role === ADMIN/MODERATOR -> abort schedule
          if (
            candidate.status !== AccountStatus.ACTIVE ||
            candidate.role === UserRole.ADMIN ||
            candidate.role === UserRole.MODERATOR
          ) {
            await this.prisma.user.updateMany({
              where: {
                id: candidate.id,
                deletionScheduledAt: { not: null },
              },
              data: {
                deletionScheduledAt: null,
              },
            });

            this.logger.warn(
              `Aborted deletion schedule for user ${candidate.id}: status=${candidate.status}, role=${candidate.role}. Cleared deletionScheduledAt.`,
            );
            abortedCount++;
            continue;
          }

          // 2(b) Pre-check: If pending/processing payments -> skip this cycle without clearing schedule
          const pendingPayments = await this.prisma.payment.count({
            where: {
              userId: candidate.id,
              status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
            },
          });

          if (pendingPayments > 0) {
            this.logger.warn(
              `User ${candidate.id} has ${pendingPayments} pending or processing payment(s). Skipping deletion this cycle.`,
            );
            skippedCount++;
            continue;
          }

          // 2(c) Hide all user content before transaction (3 attempts with 200ms delay)
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await this.visibilityService.hideAllForUser(candidate.id);
              break;
            } catch (err: any) {
              this.logger.error(
                `Attempt ${attempt} to hide content for user ${candidate.id} failed: ${err.message}`,
              );
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
            }
          }

          // 3) Collect Cloudinary image URLs before transaction
          const collectedUrls: (string | null | undefined)[] = [candidate.avatarUrl];

          // Operator profile image
          const operatorListings = await this.prisma.operatorListing.findMany({
            where: { userId: candidate.id },
            select: { profileImageUrl: true },
          });
          for (const op of operatorListings) {
            collectedUrls.push(op.profileImageUrl);
          }

          // Listing images
          const listingImages = await this.prisma.listingImage.findMany({
            where: { listing: { sellerId: candidate.id } },
            select: { url: true },
          });
          for (const img of listingImages) {
            collectedUrls.push(img.url);
          }

          // Bus listing images
          const busImages = await this.prisma.busListingImage.findMany({
            where: { busListing: { userId: candidate.id } },
            select: { url: true },
          });
          for (const img of busImages) {
            collectedUrls.push(img.url);
          }

          // Equipment listing images
          const equipmentImages = await this.prisma.equipmentListingImage.findMany({
            where: { equipmentListing: { userId: candidate.id } },
            select: { url: true },
          });
          for (const img of equipmentImages) {
            collectedUrls.push(img.url);
          }

          // Spare part images
          const sparePartImages = await this.prisma.sparePartImage.findMany({
            where: { sparePart: { sellerId: candidate.id } },
            select: { url: true },
          });
          for (const img of sparePartImages) {
            collectedUrls.push(img.url);
          }

          // Car service images
          const serviceImages = await this.prisma.carServiceImage.findMany({
            where: { carService: { userId: candidate.id } },
            select: { url: true },
          });
          for (const img of serviceImages) {
            collectedUrls.push(img.url);
          }

          // Job application resume URLs
          const jobApplications = await this.prisma.jobApplication.findMany({
            where: { applicantId: candidate.id },
            select: { resumeUrl: true },
          });
          for (const app of jobApplications) {
            collectedUrls.push(app.resumeUrl);
          }

          const cloudinaryPublicIds = new Set<string>();
          for (const url of collectedUrls) {
            const publicId = extractCloudinaryPublicId(url);
            if (publicId) {
              cloudinaryPublicIds.add(publicId);
            }
          }

          // 4) Execute final database transaction
          const originalEmail = candidate.email;
          const originalDisplayName = candidate.displayName;

          const txResult = await this.prisma.$transaction(
            async (tx) => {
              // CAS: update status to DELETED only if deletionScheduledAt <= now and status == ACTIVE
              const casUpdate = await tx.user.updateMany({
                where: {
                  id: candidate.id,
                  deletionScheduledAt: { lte: now },
                  status: AccountStatus.ACTIVE,
                },
                data: {
                  status: AccountStatus.DELETED,
                },
              });

              if (casUpdate.count === 0) {
                this.logger.warn(
                  `CAS update failed for user ${candidate.id} (status changed or deletion cancelled). Skipping further processing.`,
                );
                return { skipped: true };
              }

              // 4(a) Anonymize User record
              const anonymizedUsername = `deleted_${Date.now()}_${candidate.id.slice(-6)}`;
              await tx.user.update({
                where: { id: candidate.id },
                data: {
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
                  username: anonymizedUsername,
                  deletedAt: now,
                  deletionScheduledAt: null,
                  tokenVersion: { increment: 1 },
                },
              });

              // 4(b) Delete child records from auxiliary tables
              await tx.authIdentity.deleteMany({ where: { userId: candidate.id } });
              await tx.refreshToken.deleteMany({ where: { userId: candidate.id } });
              await tx.otpChallenge.deleteMany({ where: { userId: candidate.id } });
              await tx.pushToken.deleteMany({ where: { userId: candidate.id } });
              await tx.pushSubscription.deleteMany({ where: { userId: candidate.id } });
              await tx.favorite.deleteMany({ where: { userId: candidate.id } });
              await tx.notification.deleteMany({ where: { userId: candidate.id } });

              // 4(c) Anonymization matrix across the 11 entities in OWNER_VISIBILITY_REGISTRY
              for (const config of OWNER_VISIBILITY_REGISTRY) {
                const payload = ENTITY_ANONYMIZATION_PAYLOADS[config.prismaDelegate];
                if (payload) {
                  const delegate = (tx as any)[config.prismaDelegate];
                  if (delegate && typeof delegate.updateMany === 'function') {
                    await delegate.updateMany({
                      where: { [config.ownerField]: candidate.id },
                      data: payload,
                    });
                  }
                }
              }

              // 4(d) Wipe rows from listing image tables (preserve parent listings to avoid cascading conversation deletion)
              await tx.listingImage.deleteMany({
                where: { listing: { sellerId: candidate.id } },
              });
              await tx.busListingImage.deleteMany({
                where: { busListing: { userId: candidate.id } },
              });
              await tx.equipmentListingImage.deleteMany({
                where: { equipmentListing: { userId: candidate.id } },
              });
              await tx.sparePartImage.deleteMany({
                where: { sparePart: { sellerId: candidate.id } },
              });
              await tx.carServiceImage.deleteMany({
                where: { carService: { userId: candidate.id } },
              });

              // 4(e) Specific entity updates
              // JobApplication: clear message and resumeUrl
              await tx.jobApplication.updateMany({
                where: { applicantId: candidate.id },
                data: { resumeUrl: null, message: null },
              });

              // Review: replace comment with placeholder, retain rating
              await tx.review.updateMany({
                where: { reviewerId: candidate.id },
                data: { comment: '[تم حذف التعليق من قبل المستخدم]' },
              });

              // Payment: strip IP address and metadata
              await tx.payment.updateMany({
                where: { userId: candidate.id },
                data: { ipAddress: null, metadata: Prisma.DbNull },
              });

              // LoginAudit: wipe original email, userId, ipAddress, userAgent
              const auditConditions: Prisma.LoginAuditWhereInput[] = [{ userId: candidate.id }];
              if (originalEmail) {
                auditConditions.push({ email: originalEmail });
              }
              await tx.loginAudit.updateMany({
                where: { OR: auditConditions },
                data: {
                  email: '[DELETED]',
                  userId: null,
                  ipAddress: null,
                  userAgent: null,
                },
              });

              // 4(f) Transport quotes, requests, and subscriptions
              const carrier = await tx.carrierProfile.findUnique({
                where: { userId: candidate.id },
                select: { id: true },
              });
              if (carrier) {
                await tx.transportQuote.updateMany({
                  where: { carrierId: carrier.id, status: QuoteStatus.PENDING },
                  data: { status: QuoteStatus.WITHDRAWN },
                });
              }

              await tx.transportRequest.updateMany({
                where: {
                  userId: candidate.id,
                  status: { in: [TransportRequestStatus.OPEN, TransportRequestStatus.QUOTED] },
                },
                data: { status: TransportRequestStatus.CANCELLED },
              });

              await tx.subscription.updateMany({
                where: { userId: candidate.id },
                data: { autoRenew: false, status: SubscriptionStatus.CANCELLED },
              });

              return { skipped: false };
            },
            ACCOUNT_DELETION_TX_CONFIG,
          );

          if (txResult.skipped) {
            skippedCount++;
            continue;
          }

          // 5) Post-commit hooks (only executed if transaction was successfully committed)
          await this.accessTokenGate.invalidate(candidate.id);

          if (originalEmail && originalEmail.trim().length > 0) {
            try {
              await this.mailService.sendFinalDeletionEmail(originalEmail, originalDisplayName);
            } catch (err: any) {
              this.logger.warn(
                `Failed to send final deletion email to ${originalEmail} for user ${candidate.id}: ${err.message}`,
              );
            }
          }

          for (const publicId of cloudinaryPublicIds) {
            try {
              await this.cloudinaryService.delete(publicId);
            } catch (err: any) {
              this.logger.warn(
                `Failed to delete Cloudinary asset ${publicId} for user ${candidate.id}: ${err.message}`,
              );
            }
          }

          processedCount++;
          this.logger.log(`Successfully finalized account deletion for user ${candidate.id}`);
        }
      }

      this.logger.log(
        `Account deletion job cycle completed: processed=${processedCount}, skipped=${skippedCount}, aborted=${abortedCount}`,
      );

      return { processedCount, skippedCount, abortedCount };
    } finally {
      if (lockAcquired) {
        try {
          await this.redisService.del(ACCOUNT_DELETION_LOCK_KEY);
        } catch (err: any) {
          this.logger.warn(`Failed to release account deletion lock: ${err.message}`);
        }
      }
    }
  }
}
