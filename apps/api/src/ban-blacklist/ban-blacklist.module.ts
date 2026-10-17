import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BanBlacklistService } from './ban-blacklist.service';

@Module({
  imports: [PrismaModule],
  providers: [BanBlacklistService],
  exports: [BanBlacklistService],
})
export class BanBlacklistModule {}
