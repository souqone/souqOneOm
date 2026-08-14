import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getGovernorates() {
    return this.prisma.governorate.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async getWilayas(governorateId: number) {
    return this.prisma.wilaya.findMany({
      where: { 
        governorateId,
        isActive: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}
