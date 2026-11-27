import {
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { MessageType } from '@prisma/client';
import {
  CHAT_MESSAGE_CONTENT_REQUIRED_MSG,
  CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG,
  getChatMediaUrlValidationError,
  isMediaMessageType,
} from '../chat-message.utils';
import {
  CHAT_CLIENT_ALLOWED_MESSAGE_TYPES,
  CHAT_INVALID_TYPE_MSG,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_MESSAGE_TOO_LONG_MSG,
  CHAT_SYSTEM_FORBIDDEN_MSG,
} from '../chat-security.constants';

@ValidatorConstraint({ name: 'requireNonMediaContent', async: false })
class RequireNonMediaContentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as SendMessageDto;
    if (isMediaMessageType(dto.type)) {
      return true;
    }
    return typeof value === 'string' && value.length >= 1;
  }

  defaultMessage(): string {
    return CHAT_MESSAGE_CONTENT_REQUIRED_MSG;
  }
}

@ValidatorConstraint({ name: 'trustedChatMediaUrl', async: false })
class TrustedChatMediaUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as SendMessageDto;
    return getChatMediaUrlValidationError(dto.type, value) === null;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as SendMessageDto;
    return (
      getChatMediaUrlValidationError(dto.type, args.value) ?? CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG
    );
  }
}

export class SendMessageDto {
  @ValidateIf(
    (o: SendMessageDto) =>
      !isMediaMessageType(o.type) || (o.content !== undefined && o.content !== null),
  )
  @IsString()
  @MaxLength(CHAT_MESSAGE_MAX_LENGTH, { message: CHAT_MESSAGE_TOO_LONG_MSG })
  @Validate(RequireNonMediaContentConstraint)
  content?: string;

  @IsOptional()
  @IsEnum(MessageType, { message: CHAT_INVALID_TYPE_MSG })
  @IsIn(CHAT_CLIENT_ALLOWED_MESSAGE_TYPES, { message: CHAT_SYSTEM_FORBIDDEN_MSG })
  type?: MessageType;

  @ValidateIf(
    (o: SendMessageDto) =>
      isMediaMessageType(o.type) ||
      (o.mediaUrl !== undefined && o.mediaUrl !== null && o.mediaUrl !== ''),
  )
  @IsString()
  @IsNotEmpty({ message: CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG })
  @Validate(TrustedChatMediaUrlConstraint)
  mediaUrl?: string;
}
