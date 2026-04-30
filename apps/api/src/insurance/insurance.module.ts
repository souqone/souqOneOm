import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';

@Module({
  controllers: [InsuranceController],
})
export class InsuranceModule {}
