import { IsString, IsObject, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushKeys {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class PushSubscriptionDto {
  @IsUrl({}, { message: 'endpoint must be a valid URL' })
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushKeys)
  keys!: PushKeys;
}

export class PushUnsubscribeDto {
  @IsUrl({}, { message: 'endpoint must be a valid URL' })
  endpoint!: string;
}
