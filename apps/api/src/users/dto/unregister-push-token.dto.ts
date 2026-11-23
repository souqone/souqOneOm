import { IsOptional, IsString } from 'class-validator';

export class UnregisterPushTokenDto {
  @IsOptional()
  @IsString()
  token?: string;
}
