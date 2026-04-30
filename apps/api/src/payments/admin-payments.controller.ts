import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_DLQ } from './payment-webhook.processor';

@UseGuards(AdminApiKeyGuard)
@Controller('admin/payments')
export class AdminPaymentsController {
  private readonly logger = new Logger(AdminPaymentsController.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PAYMENT_DLQ) private readonly dlq: Queue,
  ) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const p = Math.max(page, 1);
    const l = Math.min(Math.max(limit, 1), 100);
    const skip = (p - 1) * l;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } };
  }

  @Get('stats')
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalRevenue, countByStatus, todayPayments, recentFraudSignals] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: true,
      }),
      this.prisma.payment.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // Fraud signal: users with > 10 payment attempts in last hour
      this.prisma.payment.groupBy({
        by: ['userId'],
        orderBy: { userId: 'asc' },
        where: {
          createdAt: { gte: new Date(Date.now() - 3600_000) },
        },
        _count: true,
        having: { userId: { _count: { gt: 10 } } },
      }),
    ]);

    if (recentFraudSignals.length > 0) {
      this.logger.warn(`Fraud signal: ${recentFraudSignals.length} users with >10 payment attempts/hour`);
    }

    const statusMap: Record<string, number> = {};
    for (const s of countByStatus) {
      statusMap[s.status] = typeof s._count === 'number' ? s._count : 0;
    }

    return {
      totalRevenueBaisa: totalRevenue._sum.amount || 0,
      totalRevenueOMR: ((totalRevenue._sum.amount || 0) / 1000).toFixed(3),
      totalPaidCount: totalRevenue._count,
      todayPayments,
      byStatus: statusMap,
      fraudSignals: recentFraudSignals.map(s => ({ userId: s.userId, attempts: s._count })),
    };
  }

  @Get('metrics')
  async getMetrics() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000);

    // Success rate
    const [totalCount, paidCount] = await this.prisma.$transaction([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
    ]);
    const successRate = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : '0';

    // Avg payment time (CREATED → PAID)
    const paidPayments = await this.prisma.payment.findMany({
      where: { status: 'PAID', paidAt: { not: null } },
      select: { createdAt: true, paidAt: true },
      take: 200,
      orderBy: { paidAt: 'desc' },
    });

    let avgPaymentTimeMs = 0;
    if (paidPayments.length > 0) {
      const totalMs = paidPayments.reduce((sum, p) => {
        return sum + (p.paidAt!.getTime() - p.createdAt.getTime());
      }, 0);
      avgPaymentTimeMs = totalMs / paidPayments.length;
    }
    const avgPaymentTimeSec = Math.round(avgPaymentTimeMs / 1000);

    // Webhook failure rate (from events)
    const [webhookTotal, webhookFailed] = await this.prisma.$transaction([
      this.prisma.paymentEvent.count({ where: { event: 'WEBHOOK_RECEIVED' } }),
      this.prisma.paymentEvent.count({ where: { event: 'INVALID_TRANSITION' } }),
    ]);

    // Failure rate by IP (top 10 offenders)
    const failedByIp = await this.prisma.payment.groupBy({
      by: ['ipAddress'],
      orderBy: { ipAddress: 'asc' },
      where: {
        status: { in: ['FAILED', 'EXPIRED'] },
        ipAddress: { not: null },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    const topOffenders = failedByIp
      .filter(r => typeof r._count === 'number' && r._count > 3)
      .sort((a, b) => ((b._count as number) || 0) - ((a._count as number) || 0))
      .slice(0, 10)
      .map(r => ({ ip: r.ipAddress, failures: r._count }));

    // Daily volume (last 7 days)
    const dailyVolume: { date: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [count, revenue] = await this.prisma.$transaction([
        this.prisma.payment.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.payment.aggregate({
          where: { status: 'PAID', paidAt: { gte: dayStart, lt: dayEnd } },
          _sum: { amount: true },
        }),
      ]);

      dailyVolume.push({
        date: dayStart.toISOString().split('T')[0],
        count,
        revenue: (revenue._sum.amount || 0) / 1000,
      });
    }

    // DLQ count
    const dlqWaiting = await this.dlq.getWaitingCount();
    const dlqFailed = await this.dlq.getFailedCount();

    return {
      successRate: `${successRate}%`,
      totalPayments: totalCount,
      paidPayments: paidCount,
      avgPaymentTimeSec,
      avgPaymentTimeFormatted: avgPaymentTimeSec > 60
        ? `${Math.floor(avgPaymentTimeSec / 60)}m ${avgPaymentTimeSec % 60}s`
        : `${avgPaymentTimeSec}s`,
      webhookStats: { total: webhookTotal, failures: webhookFailed },
      topFailureIPs: topOffenders,
      dailyVolume,
      dlq: { waiting: dlqWaiting, failed: dlqFailed },
    };
  }

  @Get('dlq')
  async getDlqJobs() {
    const waiting = await this.dlq.getWaiting(0, 50);
    const failed = await this.dlq.getFailed(0, 50);

    return {
      waiting: waiting.map(j => ({ id: j.id, data: j.data, timestamp: j.timestamp })),
      failed: failed.map(j => ({ id: j.id, data: j.data, failedReason: j.failedReason, timestamp: j.timestamp })),
      counts: { waiting: waiting.length, failed: failed.length },
    };
  }

  @Get(':paymentId/events')
  async getPaymentEvents(@Param('paymentId') paymentId: string) {
    const events = await this.prisma.paymentEvent.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'asc' },
    });
    return { paymentId, events };
  }
}
