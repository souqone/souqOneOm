import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransportExpiryService {
  private readonly logger = new Logger(TransportExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireOldRequests() {
    const { count } = await this.prisma.transportRequest.updateMany({
      where: {
        status: { in: ['OPEN', 'QUOTED'] },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    if (count > 0) this.logger.log(`Expired ${count} transport requests`);
  }
}
