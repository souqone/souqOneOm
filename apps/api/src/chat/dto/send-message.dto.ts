import { IsString, IsOptional, IsEnum, MinLength, ValidateIf, IsNotEmpty } from 'class-validator';
import { MessageType } from '@prisma/client';
import {
  CHAT_MESSAGE_CONTENT_REQUIRED_MSG,
  CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG,
  isMediaMessageType,
} from '../chat-message.utils';

export class SendMessageDto {
  @ValidateIf(
    (o: SendMessageDto) =>
      !isMediaMessageType(o.type) || (o.content !== undefined && typeof o.content !== 'string'),
  )
  @IsString()
  @MinLength(1, { message: CHAT_MESSAGE_CONTENT_REQUIRED_MSG })
  content?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ValidateIf(
    (o: SendMessageDto) =>
      isMediaMessageType(o.type) ||
      (o.mediaUrl !== undefined && o.mediaUrl !== null && o.mediaUrl !== ''),
  )
  @IsString()
  @IsNotEmpty({ message: CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG })
  mediaUrl?: string;
}
