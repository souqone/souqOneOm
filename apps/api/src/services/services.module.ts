import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { PrismaModule } from '../prisma/prisma.module';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
