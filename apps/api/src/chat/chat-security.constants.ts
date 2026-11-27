import { MessageType } from '@prisma/client';

export const CHAT_MESSAGE_MAX_LENGTH = 4000;

export const CHAT_CLIENT_ALLOWED_MESSAGE_TYPES: readonly MessageType[] = [
  MessageType.TEXT,
  MessageType.IMAGE,
  MessageType.AUDIO,
  MessageType.FILE,
];

/**
 * Exact reaction emoji allowlist aligned with mobile `ReactionPicker.tsx`
 * (`src/components/chat/ReactionPicker.tsx:6`).
 */
export const CHAT_REACTION_ALLOWED_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🙏',
  '🔥',
  '👏',
  '🎉',
  '😍',
] as const;

export const CHAT_REACTION_ALLOWED_EMOJI_SET: ReadonlySet<string> = new Set(
  CHAT_REACTION_ALLOWED_EMOJIS,
);

export const CHAT_REACTION_EMOJI_MAX_LENGTH = 16;

// Redis-backed WebSocket rate limits (INCR + EXPIRE pattern)
export const CHAT_WS_SEND_LIMIT = 5;
export const CHAT_WS_SEND_WINDOW_SEC = 10;
export const CHAT_WS_SEND_KEY_PREFIX = 'chat:ws:rl:send:';

export const CHAT_WS_REACT_LIMIT = 30;
export const CHAT_WS_REACT_WINDOW_SEC = 60;
export const CHAT_WS_REACT_KEY_PREFIX = 'chat:ws:rl:react:';

export const CHAT_WS_CHECK_ONLINE_LIMIT = 30;
export const CHAT_WS_CHECK_ONLINE_WINDOW_SEC = 60;
export const CHAT_WS_CHECK_ONLINE_KEY_PREFIX = 'chat:ws:rl:online:';

export const CHAT_SYSTEM_FORBIDDEN_MSG = 'غير مسموح بإرسال رسائل النظام من العميل';
export const CHAT_INVALID_TYPE_MSG = 'نوع الرسالة غير صالح';
export const CHAT_MESSAGE_TOO_LONG_MSG = `محتوى الرسالة يتجاوز الحد الأقصى المسموح (${CHAT_MESSAGE_MAX_LENGTH} حرف)`;
export const CHAT_MEDIA_URL_UNTRUSTED_MSG = 'رابط الوسائط غير مدعوم أو غير موثوق';
export const CHAT_TEXT_MEDIA_URL_FORBIDDEN_MSG = 'لا يمكن إرفاق رابط وسائط مع رسالة نصية';
export const CHAT_REACTION_INVALID_EMOJI_MSG = 'رمز التفاعل غير مدعوم';
export const CHAT_REACTION_DELETED_MSG = 'لا يمكن التفاعل مع رسالة محذوفة';

export const CHAT_WS_SEND_RATE_LIMIT_MSG =
  'أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار ثوانٍ ثم إعادة المحاولة.';
export const CHAT_WS_REACT_RATE_LIMIT_MSG = 'أنت ترسل التفاعلات بسرعة كبيرة. يرجى الانتظار قليلاً.';
export const CHAT_WS_ONLINE_RATE_LIMIT_MSG =
  'طلبات التحقق من حالة الاتصال كثيرة جداً. يرجى الانتظار.';
