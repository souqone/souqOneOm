import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import {
  CHAT_MEDIA_RULES,
  type ChatMediaKind,
  type ChatMediaRule,
  type CloudinaryResourceType,
  LOCAL_UPLOAD_PREFIX,
} from './chat-media.constants';

const IMAGE_FTYP_BRANDS = new Set([
  'avif',
  'avis',
  'heic',
  'heix',
  'hevc',
  'hevx',
  'mif1',
  'msf1',
  'heif',
]);

const AUDIO_FTYP_BRANDS = new Set([
  'M4A ',
  'M4B ',
  'M4P ',
  'mp41',
  'mp42',
  'isom',
  'iso2',
  'iso5',
  'iso6',
  '3gp4',
  '3gp5',
  '3g2a',
  'qt  ',
  'F4A ',
  'F4V ',
  'dash',
]);

const CLOUDINARY_RESOURCE_PREFIX_RE = /^(image|raw|video):(carone\/.+)$/;
const LOCAL_RELATIVE_KEY_SAFE_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

function readAscii(buf: Buffer, start: number, end: number): string {
  return buf.subarray(start, end).toString('ascii');
}

function isFtypContainer(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (readAscii(buf, 4, 8) !== 'ftyp') return null;
  return readAscii(buf, 8, 12);
}

function isImageMagicBytes(buf: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return true;
  }
  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    readAscii(buf, 0, 4) === 'RIFF' &&
    readAscii(buf, 8, 12) === 'WEBP'
  ) {
    return true;
  }
  // HEIC / HEIF / AVIF: ftyp + image brand
  const ftypBrand = isFtypContainer(buf);
  if (ftypBrand && IMAGE_FTYP_BRANDS.has(ftypBrand)) {
    return true;
  }
  return false;
}

function isPdfMagicBytes(buf: Buffer): boolean {
  // Strictly starts with %PDF-
  return buf.length >= 5 && readAscii(buf, 0, 5) === '%PDF-';
}

function isAudioMagicBytes(buf: Buffer): boolean {
  // MP4 / M4A: ftyp + audio/video container brand (never image heic/avif)
  const ftypBrand = isFtypContainer(buf);
  if (ftypBrand && AUDIO_FTYP_BRANDS.has(ftypBrand)) {
    return true;
  }
  // MP3 with ID3 tag
  if (buf.length >= 3 && readAscii(buf, 0, 3) === 'ID3') {
    return true;
  }
  // MPEG Audio Layer III frame sync (MP3) or ADTS AAC header (rejects UTF-16 BOM FF FE / FF FF)
  if (
    buf.length >= 2 &&
    buf[0] === 0xff &&
    ((buf[1] & 0xe6) === 0xe2 || (buf[1] & 0xf6) === 0xf0)
  ) {
    return true;
  }
  // ADIF AAC
  if (buf.length >= 4 && readAscii(buf, 0, 4) === 'ADIF') {
    return true;
  }
  // Ogg container
  if (buf.length >= 4 && readAscii(buf, 0, 4) === 'OggS') {
    return true;
  }
  // WAV: RIFF....WAVE
  if (
    buf.length >= 12 &&
    readAscii(buf, 0, 4) === 'RIFF' &&
    readAscii(buf, 8, 12) === 'WAVE'
  ) {
    return true;
  }
  // WebM / Matroska EBML header
  if (
    buf.length >= 4 &&
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return true;
  }
  return false;
}

export function resolveChatMediaRule(mimetype?: string): ChatMediaRule | null {
  if (!mimetype || typeof mimetype !== 'string') {
    return null;
  }
  const normalizedMime = mimetype.split(';')[0].trim().toLowerCase();
  for (const rule of Object.values(CHAT_MEDIA_RULES)) {
    if (rule.mimes.includes(normalizedMime)) {
      return rule;
    }
  }
  return null;
}

export function hasMatchingMagicBytes(kind: ChatMediaKind, buffer: Buffer): boolean {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return false;
  }
  switch (kind) {
    case 'IMAGE':
      return isImageMagicBytes(buffer);
    case 'PDF':
      return isPdfMagicBytes(buffer);
    case 'AUDIO':
      return isAudioMagicBytes(buffer);
  }
}

export function validateChatMediaFile(file: Express.Multer.File): {
  rule: ChatMediaRule;
  safeExtension: string;
} {
  if (!file) {
    throw new BadRequestException('لم يتم تحميل أي ملف');
  }

  const rule = resolveChatMediaRule(file.mimetype);
  if (!rule) {
    throw new BadRequestException(
      'نوع الملف غير مدعوم. يُسمح بالصور وملفات PDF والملفات الصوتية فقط',
    );
  }

  const byteSize = typeof file.size === 'number' ? file.size : file.buffer?.length ?? 0;
  if (byteSize <= 0 || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException('الملف المرفق فارغ أو غير صالح');
  }

  if (byteSize > rule.maxBytes || file.buffer.length > rule.maxBytes) {
    const limitMb = Math.round(rule.maxBytes / (1024 * 1024));
    throw new BadRequestException(`حجم الملف يتجاوز الحد الأقصى (${limitMb}MB)`);
  }

  const rawExt = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
  if (rawExt && !rule.extensions.includes(rawExt)) {
    throw new BadRequestException('امتداد الملف لا يطابق نوع الملف المسموح');
  }

  if (!hasMatchingMagicBytes(rule.kind, file.buffer)) {
    throw new BadRequestException('محتوى الملف لا يطابق نوعه المصرّح به');
  }

  const safeExtension = rawExt && rule.extensions.includes(rawExt) ? rawExt : rule.defaultExtension;
  return { rule, safeExtension };
}

export function buildCloudinaryStorageKey(
  resourceType: CloudinaryResourceType,
  publicId: string,
): string {
  return `${resourceType}:${publicId}`;
}

export type ParsedStorageKey =
  | { kind: 'cloudinary'; resourceType: CloudinaryResourceType; publicId: string }
  | { kind: 'local'; relativePath: string };

export function parseStorageKey(key: string): ParsedStorageKey | null {
  if (!key || typeof key !== 'string') {
    return null;
  }
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('\0') || trimmed.includes('\\')) {
    return null;
  }

  const prefixedMatch = CLOUDINARY_RESOURCE_PREFIX_RE.exec(trimmed);
  if (prefixedMatch) {
    return {
      kind: 'cloudinary',
      resourceType: prefixedMatch[1] as CloudinaryResourceType,
      publicId: prefixedMatch[2],
    };
  }

  if (trimmed.startsWith('carone/')) {
    return {
      kind: 'cloudinary',
      resourceType: 'image',
      publicId: trimmed,
    };
  }

  const cleanLocal = trimmed.startsWith(LOCAL_UPLOAD_PREFIX)
    ? trimmed.slice(LOCAL_UPLOAD_PREFIX.length)
    : trimmed;

  if (!cleanLocal || !LOCAL_RELATIVE_KEY_SAFE_RE.test(cleanLocal)) {
    return null;
  }

  return { kind: 'local', relativePath: cleanLocal };
}

/**
 * Resolves a stored chat Message.mediaUrl to a deletion storage key ONLY if it
 * belongs to our own local `/uploads/` directory or our configured Cloudinary cloud
 * under `carone/(chat|listings)/`. Returns null for foreign/untrusted URLs so
 * deleting a message can never trigger SSRF or arbitrary external deletion.
 */
export function extractOwnedChatMediaKey(url: string, cloudName?: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('\0') || trimmed.includes('\\')) {
    return null;
  }

  // Relative local upload URL: `/uploads/...`
  if (trimmed.startsWith(LOCAL_UPLOAD_PREFIX)) {
    const cleanPath = trimmed.split(/[?#]/)[0].slice(LOCAL_UPLOAD_PREFIX.length);
    if (!cleanPath || cleanPath.includes('..') || !LOCAL_RELATIVE_KEY_SAFE_RE.test(cleanPath)) {
      return null;
    }
    return cleanPath;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  // Localhost upload URL in non-production
  const isProduction = process.env.NODE_ENV === 'production';
  if (
    !isProduction &&
    (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
    parsed.pathname.startsWith(LOCAL_UPLOAD_PREFIX)
  ) {
    const cleanPath = parsed.pathname.slice(LOCAL_UPLOAD_PREFIX.length);
    if (!cleanPath || cleanPath.includes('..') || !LOCAL_RELATIVE_KEY_SAFE_RE.test(cleanPath)) {
      return null;
    }
    return cleanPath;
  }

  // Owned Cloudinary URL: https://res.cloudinary.com/<cloudName>/<resourceType>/upload/[v123/]carone/(chat|listings)/...
  const trimmedCloudName = cloudName?.trim();
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'res.cloudinary.com' ||
    !trimmedCloudName
  ) {
    return null;
  }

  const cloudPathRe = new RegExp(
    `^/${escapeRegex(trimmedCloudName)}/(image|video|raw)/upload/(?:v\\d+/)?(carone/(?:chat|listings)/.+)$`,
  );
  const match = cloudPathRe.exec(parsed.pathname);
  if (!match) {
    return null;
  }

  const resourceType = match[1] as CloudinaryResourceType;
  const rawAssetPath = match[2];
  if (rawAssetPath.includes('..')) {
    return null;
  }

  // Cloudinary raw public_ids include the extension; image/video public_ids omit it.
  const publicId =
    resourceType === 'raw' ? rawAssetPath : rawAssetPath.replace(/\.[a-z0-9]+$/i, '');

  return buildCloudinaryStorageKey(resourceType, publicId);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
