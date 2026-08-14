import { Module } from '@nestjs/common';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';
import { PrismaModule } from '../prisma/prisma.module';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
