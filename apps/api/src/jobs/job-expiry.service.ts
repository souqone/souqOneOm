import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const JOB_EXPIRY_DAYS = 30;

@Injectable()
export class JobExpiryService {
  private readonly logger = new Logger(JobExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireOldJobs() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - JOB_EXPIRY_DAYS);

    const { count } = await this.prisma.driverJob.updateMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });

    if (count > 0) {
      this.logger.log(`Expired ${count} jobs older than ${JOB_EXPIRY_DAYS} days`);
    }
  }

}
