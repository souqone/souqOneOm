import { BadRequestException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { extractOwnedChatMediaKey } from '../uploads/chat-media.validator';
import {
  CHAT_INVALID_TYPE_MSG,
  CHAT_MEDIA_URL_UNTRUSTED_MSG,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_MESSAGE_TOO_LONG_MSG,
  CHAT_SYSTEM_FORBIDDEN_MSG,
  CHAT_TEXT_MEDIA_URL_FORBIDDEN_MSG,
} from './chat-security.constants';

export const CHAT_MESSAGE_CONTENT_REQUIRED_MSG = 'محتوى الرسالة مطلوب';
export const CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG = 'رابط الوسائط مطلوب';

const MEDIA_MESSAGE_TYPES: ReadonlySet<MessageType> = new Set([
  MessageType.IMAGE,
  MessageType.FILE,
  MessageType.AUDIO,
]);

const MEDIA_NOTIFICATION_FALLBACK: Readonly<Record<MessageType, string>> = {
  [MessageType.TEXT]: '',
  [MessageType.SYSTEM]: '',
  [MessageType.IMAGE]: 'صورة',
  [MessageType.FILE]: 'ملف',
  [MessageType.AUDIO]: 'رسالة صوتية',
};

const MESSAGE_TYPE_LOOKUP: Readonly<Record<string, MessageType>> = {
  TEXT: MessageType.TEXT,
  IMAGE: MessageType.IMAGE,
  AUDIO: MessageType.AUDIO,
  FILE: MessageType.FILE,
  SYSTEM: MessageType.SYSTEM,
};

export function isMediaMessageType(type?: MessageType | string | null): boolean {
  return Boolean(type && MEDIA_MESSAGE_TYPES.has(type as MessageType));
}

export function parseClientMessageType(raw: unknown): MessageType | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw !== 'string' || !Object.prototype.hasOwnProperty.call(MESSAGE_TYPE_LOOKUP, raw)) {
    throw new BadRequestException(CHAT_INVALID_TYPE_MSG);
  }
  const mapped = MESSAGE_TYPE_LOOKUP[raw];
  if (mapped === MessageType.SYSTEM) {
    throw new BadRequestException(CHAT_SYSTEM_FORBIDDEN_MSG);
  }
  return mapped;
}

export function getChatMediaUrlValidationError(
  type: MessageType | undefined,
  mediaUrl: unknown,
): string | null {
  if (!isMediaMessageType(type)) {
    if (mediaUrl !== undefined && mediaUrl !== null && mediaUrl !== '') {
      return CHAT_TEXT_MEDIA_URL_FORBIDDEN_MSG;
    }
    return null;
  }

  if (typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
    return CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG;
  }

  // Compatibility: older mobile builds still upload chat IMAGEs to POST /uploads (listings prefix).
  const key = extractOwnedChatMediaKey(mediaUrl, process.env.CLOUDINARY_CLOUD_NAME, {
    allowLegacyListings: type === MessageType.IMAGE,
  });
  if (!key) {
    return CHAT_MEDIA_URL_UNTRUSTED_MSG;
  }

  return null;
}

export function validateSendMessagePayload(payload: {
  type?: MessageType;
  content?: string;
  mediaUrl?: string;
}): void {
  const resolvedType = parseClientMessageType(payload.type);

  if (payload.content !== undefined && typeof payload.content !== 'string') {
    throw new BadRequestException(CHAT_MESSAGE_CONTENT_REQUIRED_MSG);
  }
  if (typeof payload.content === 'string' && payload.content.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new BadRequestException(CHAT_MESSAGE_TOO_LONG_MSG);
  }

  const mediaUrlError = getChatMediaUrlValidationError(resolvedType, payload.mediaUrl);
  if (mediaUrlError) {
    throw new BadRequestException(mediaUrlError);
  }

  if (isMediaMessageType(resolvedType)) {
    return;
  }

  if (typeof payload.content !== 'string' || payload.content.trim() === '') {
    throw new BadRequestException(CHAT_MESSAGE_CONTENT_REQUIRED_MSG);
  }
}

export function resolveMessageNotificationBody(
  type: MessageType | undefined,
  content: string | undefined,
): string {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (trimmed.length > 0) {
    return (content as string).substring(0, 100);
  }
  const resolvedType = type ?? MessageType.TEXT;
  return MEDIA_NOTIFICATION_FALLBACK[resolvedType] ?? '';
}
