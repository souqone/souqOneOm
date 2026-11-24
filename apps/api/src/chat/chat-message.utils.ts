import { BadRequestException } from '@nestjs/common';
import { MessageType } from '@prisma/client';

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

export function isMediaMessageType(type?: MessageType | string | null): boolean {
  return Boolean(type && MEDIA_MESSAGE_TYPES.has(type as MessageType));
}

export function validateSendMessagePayload(payload: {
  type?: MessageType;
  content?: string;
  mediaUrl?: string;
}): void {
  if (isMediaMessageType(payload.type)) {
    if (typeof payload.mediaUrl !== 'string' || payload.mediaUrl.trim() === '') {
      throw new BadRequestException(CHAT_MESSAGE_MEDIA_URL_REQUIRED_MSG);
    }
    if (payload.content !== undefined && typeof payload.content !== 'string') {
      throw new BadRequestException(CHAT_MESSAGE_CONTENT_REQUIRED_MSG);
    }
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
