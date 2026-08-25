import { Module } from '@nestjs/common';
import { DiagGateway } from './diag.gateway';

@Module({
  providers: [DiagGateway],
})
export class DiagModule {}
