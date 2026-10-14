import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './listings.repository';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LocationsModule, PrismaModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsRepository],
  exports: [ListingsService, ListingsRepository],
})
export class ListingsModule {}
