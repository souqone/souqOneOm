import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';

@Global()
@Module({
  providers: [PrismaService, SellerContactGate],
  exports: [PrismaService, SellerContactGate],
})
export class PrismaModule {}
