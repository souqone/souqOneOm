/**
 * Extracts Cloudinary publicId from a given URL.
 *
 * Supports:
 * - Nested folders: e.g. "carone/users/avatars/user_123"
 * - Transformation segments: e.g. "/image/upload/c_scale,w_500,q_auto/..." or chained transformations
 * - Version prefixes: e.g. "/v1612345678/..." or "/v1/..."
 * - Stripping extensions: ".jpg", ".png", ".webp", ".jpeg", ".pdf", etc.
 *
 * Returns null if:
 * - URL is null, undefined, empty, or not a string
 * - Host is not res.cloudinary.com
 * - URL does not contain an upload delivery type followed by a valid publicId
 */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.hostname !== 'res.cloudinary.com') {
    return null;
  }

  // Pathname: /<cloud_name>/<asset_type>/<delivery_type>/...
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (pathParts.length < 4) {
    return null;
  }

  const deliveryIndex = pathParts.findIndex((part) =>
    ['upload', 'authenticated', 'private'].includes(part),
  );
  if (deliveryIndex === -1 || deliveryIndex === pathParts.length - 1) {
    return null;
  }

  const afterDelivery = pathParts.slice(deliveryIndex + 1);

  // Check if there is a version segment (e.g. v123456789 or v1)
  const versionIndex = afterDelivery.findIndex((segment) => /^v\d+$/.test(segment));

  let publicIdSegments: string[];
  if (versionIndex !== -1) {
    // Everything after the version segment is part of the public_id path
    publicIdSegments = afterDelivery.slice(versionIndex + 1);
  } else {
    // No version segment. Skip any transformation segments.
    // Cloudinary transformation segments typically contain commas or start with parameter keys (e.g. c_scale, w_100, f_auto, q_auto)
    let firstNonTransformIndex = 0;
    while (
      firstNonTransformIndex < afterDelivery.length - 1 &&
      (afterDelivery[firstNonTransformIndex].includes(',') ||
        /^(?:[a-z]{1,3}_[a-zA-Z0-9_-]+)/.test(afterDelivery[firstNonTransformIndex]))
    ) {
      firstNonTransformIndex++;
    }
    publicIdSegments = afterDelivery.slice(firstNonTransformIndex);
  }

  if (publicIdSegments.length === 0) {
    return null;
  }

  const fullPath = publicIdSegments.join('/');

  // Strip file extension from the end (e.g., .jpg, .webp, .png, etc.)
  const withoutExt = fullPath.replace(/\.[a-zA-Z0-9]+$/, '');

  if (!withoutExt) {
    return null;
  }

  return decodeURIComponent(withoutExt);
}
