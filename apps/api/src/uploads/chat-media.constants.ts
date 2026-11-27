export type ChatMediaKind = 'IMAGE' | 'PDF' | 'AUDIO';
export type CloudinaryResourceType = 'image' | 'raw' | 'video';

export interface ChatMediaRule {
  readonly kind: ChatMediaKind;
  readonly mimes: readonly string[];
  readonly extensions: readonly string[];
  readonly maxBytes: number;
  readonly cloudinaryResourceType: CloudinaryResourceType;
  readonly defaultExtension: string;
}

const MB = 1024 * 1024;

/**
 * Single source of truth for allowed chat media upload types, extensions,
 * per-type byte limits, and Cloudinary resource_types.
 * (`docx`/`xlsx` intentionally omitted until product sign-off.)
 */
export const CHAT_MEDIA_RULES: Readonly<Record<ChatMediaKind, ChatMediaRule>> = {
  IMAGE: {
    kind: 'IMAGE',
    mimes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'],
    maxBytes: 10 * MB,
    cloudinaryResourceType: 'image',
    defaultExtension: '.jpg',
  },
  PDF: {
    kind: 'PDF',
    mimes: ['application/pdf'],
    extensions: ['.pdf'],
    maxBytes: 10 * MB,
    cloudinaryResourceType: 'raw',
    defaultExtension: '.pdf',
  },
  AUDIO: {
    kind: 'AUDIO',
    mimes: [
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'video/mp4',
      'audio/aac',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/wav',
      'audio/x-wav',
    ],
    extensions: ['.m4a', '.mp4', '.aac', '.mp3', '.ogg', '.webm', '.wav'],
    maxBytes: 5 * MB,
    cloudinaryResourceType: 'video',
    defaultExtension: '.m4a',
  },
} as const;

export const CHAT_UPLOAD_MAX_BODY_BYTES = Math.max(
  ...Object.values(CHAT_MEDIA_RULES).map((rule) => rule.maxBytes),
);

export const CHAT_UPLOAD_FOLDER = 'carone/chat';
export const LISTINGS_UPLOAD_FOLDER = 'carone/listings';
export const LOCAL_UPLOAD_PREFIX = '/uploads/';
export const CHAT_UPLOAD_THROTTLE_LIMIT = 20;
export const CHAT_UPLOAD_THROTTLE_TTL_MS = 60000;
