import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

@Global()
@Module({
  providers: [PrismaService, SellerContactGate, ActiveListingsLimitService],
  exports: [PrismaService, SellerContactGate, ActiveListingsLimitService],
})
export class PrismaModule {}

