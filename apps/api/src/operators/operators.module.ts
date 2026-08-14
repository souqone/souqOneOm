import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
