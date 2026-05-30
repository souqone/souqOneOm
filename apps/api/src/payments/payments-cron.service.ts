import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ThawaniService } from './thawani.service';
import { PaymentsService } from './payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsCronService {
  private readonly logger = new Logger(PaymentsCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly thawani: ThawaniService,
    private readonly paymentsService: PaymentsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStalePendingPayments() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const stale = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
        thawaniSessionId: null,
      },
      select: { id: true },
    });

    for (const p of stale) {
      try {
        await this.paymentsService.markExpired(p.id);
      } catch { /* transition may fail if already changed */ }
    }

    if (stale.length > 0) {
      this.logger.log(`Marked ${stale.length} stale PENDING payments as EXPIRED`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async reconcilePayments() {
    this.logger.log('Starting daily payment reconciliation...');

    const pending = await this.prisma.payment.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        thawaniSessionId: { not: null },
        createdAt: { lt: new Date(Date.now() - 3600_000) },
      },
      take: 100,
    });

    if (pending.length === 0) {
      this.logger.log('Reconciliation: no pending payments to check');
      return;
    }

    let synced = 0;
    let failed = 0;
    let errors = 0;

    for (const payment of pending) {
      try {
        const session = await this.thawani.getSession(payment.thawaniSessionId!);

        if (session.payment_status === 'paid' && payment.status !== 'PAID') {
          await this.paymentsService.reconcilePayment(payment.id);
          synced++;
          this.logger.log(`Reconciled payment ${payment.id} → PAID`);
        } else if (
          session.payment_status === 'cancelled' ||
          session.payment_status === 'expired'
        ) {
          await this.paymentsService.markExpired(payment.id);
          failed++;
          this.logger.log(`Reconciled payment ${payment.id} → EXPIRED (${session.payment_status})`);
        }
      } catch (err) {
        errors++;
        this.logger.error(`Reconciliation error for payment ${payment.id}: ${err}`);
      }
    }

    this.logger.log(
      `Reconciliation complete: ${pending.length} checked, ${synced} synced, ${failed} failed, ${errors} errors`,
    );
  }

  /* ─── FEATURED EXPIRY — runs daily at 02:00 ─── */

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireFeaturedListings() {
    const now = new Date();
    let expired = 0;

    // ── Car Listings (owner = sellerId) ──
    const carListings = await this.prisma.listing.findMany({
      where: { isPremium: true, featuredUntil: { lt: now } },
      select: { id: true, title: true, sellerId: true },
    });
    for (const l of carListings) {
      await this.prisma.listing.update({ where: { id: l.id }, data: { isPremium: false } });
      await this.notifications.create({
        userId: l.sellerId,
        type: NotificationType.FEATURED_EXPIRED,
        title: 'انتهى الإعلان المميز',
        body: `انتهت فترة تمييز إعلانك "${l.title}"`,
        data: { listingId: l.id, listingType: 'car' },
      });
      expired++;
    }

    // ── Bus Listings (owner = userId) ──
    const busListings = await this.prisma.busListing.findMany({
      where: { isPremium: true, featuredUntil: { lt: now } },
      select: { id: true, title: true, userId: true },
    });
    for (const l of busListings) {
      await this.prisma.busListing.update({ where: { id: l.id }, data: { isPremium: false } });
      await this.notifications.create({
        userId: l.userId,
        type: NotificationType.FEATURED_EXPIRED,
        title: 'انتهى الإعلان المميز',
        body: `انتهت فترة تمييز إعلانك "${l.title}"`,
        data: { listingId: l.id, listingType: 'bus' },
      });
      expired++;
    }

    // ── Equipment Listings (owner = userId) ──
    const equipListings = await this.prisma.equipmentListing.findMany({
      where: { isPremium: true, featuredUntil: { lt: now } },
      select: { id: true, title: true, userId: true },
    });
    for (const l of equipListings) {
      await this.prisma.equipmentListing.update({ where: { id: l.id }, data: { isPremium: false } });
      await this.notifications.create({
        userId: l.userId,
        type: NotificationType.FEATURED_EXPIRED,
        title: 'انتهى الإعلان المميز',
        body: `انتهت فترة تمييز إعلانك "${l.title}"`,
        data: { listingId: l.id, listingType: 'equipment' },
      });
      expired++;
    }

    if (expired > 0) {
      this.logger.log(`Expired featured status for ${expired} listing(s)`);
    }
  }
}
