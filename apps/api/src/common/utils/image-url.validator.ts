import { BadRequestException } from '@nestjs/common';

/**
 * Validates that an image URL is from a trusted local or Cloudinary source.
 * Supports:
 * 1. Local upload relative paths: e.g. `/uploads/12345-abc.jpg`
 * 2. Non-production localhost URLs: e.g. `http://localhost:3000/...` or `http://127.0.0.1:...`
 * 3. Production/Staging Cloudinary HTTPS URLs matching the configured cloud name:
 *    e.g. `https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/...`
 */
export function validateTrustedImageUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new BadRequestException('الرابط غير مدعوم أو غير موثوق');
  }

  const trimmed = url.trim();
  if (!trimmed) {
    throw new BadRequestException('الرابط غير مدعوم أو غير موثوق');
  }

  // 1. Allow local upload paths: /uploads/... (prevent path traversal)
  if (trimmed.startsWith('/uploads/') && !trimmed.includes('..')) {
    return;
  }

  // 2. Parse full URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new BadRequestException('الرابط غير مدعوم أو غير موثوق');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  // In production, if CLOUDINARY_CLOUD_NAME is unset, reject everything
  if (isProduction && !cloudName) {
    throw new BadRequestException('الرابط غير مدعوم أو غير موثوق');
  }

  const isLocalAllowed = !isProduction;
  const isLocalhost =
    isLocalAllowed &&
    (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1');

  const isCloudinary =
    parsedUrl.protocol === 'https:' &&
    parsedUrl.hostname === 'res.cloudinary.com' &&
    Boolean(
      cloudName &&
        (parsedUrl.pathname === `/${cloudName}` ||
          parsedUrl.pathname.startsWith(`/${cloudName}/`)),
    );

  if (!isCloudinary && !isLocalhost) {
    throw new BadRequestException('الرابط غير مدعوم أو غير موثوق');
  }
}
