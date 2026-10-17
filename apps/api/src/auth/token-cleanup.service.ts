import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          // Keep revoked tokens for 7 days for security audit trail
          { revokedAt: { lt: sevenDaysAgo } },
        ],
      },
    });

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired/revoked refresh tokens`);
    }

    // Cleanup expired or consumed OTP challenges (older than 7 days if consumed, or expired)
    const { count: otpCount } = await this.prisma.otpChallenge.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { consumedAt: { lt: sevenDaysAgo } },
        ],
      },
    });

    if (otpCount > 0) {
      this.logger.log(`Cleaned up ${otpCount} expired/consumed OTP challenges`);
    }

    // Cleanup WhatsApp message logs older than 30 days (limits only need 24 hours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count: whatsappCount } = await this.prisma.whatsappMessageLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    if (whatsappCount > 0) {
      this.logger.log(`Cleaned up ${whatsappCount} old WhatsApp message logs`);
    }
  }
}
