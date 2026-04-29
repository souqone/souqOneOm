import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommended(userId: string, limit = 10) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      select: { licenseTypes: true, governorate: true, vehicleTypes: true },
    });

    if (!profile) return [];

    const { licenseTypes, governorate } = profile;
    if (licenseTypes.length === 0) return [];

    // Find matching ACTIVE jobs: same governorate + overlapping license types
    const exactMatch = await this.prisma.driverJob.findMany({
      where: {
        status: 'ACTIVE',
        governorate,
        licenseTypes: { hasSome: licenseTypes },
        userId: { not: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      },
    });

    // If not enough exact matches, also get same-governorate jobs
    if (exactMatch.length < limit) {
      const existingIds = exactMatch.map((j) => j.id);
      const govJobs = await this.prisma.driverJob.findMany({
        where: {
          status: 'ACTIVE',
          governorate,
          id: { notIn: existingIds },
          userId: { not: userId },
        },
        orderBy: { createdAt: 'desc' },
        take: limit - exactMatch.length,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
      return [...exactMatch, ...govJobs];
    }

    return exactMatch;
  }
}
