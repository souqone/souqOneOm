import { SetMetadata } from '@nestjs/common';

export const EXPOSE_PHONE_KEY = 'exposePhone';

/**
 * Decorator to explicitly allow exposing the user `phone` field in API responses.
 * Routes without this decorator will have `phone` stripped recursively by SanitizeInterceptor.
 * Note: Legacy contact fields (`contactPhone`, `whatsapp`, `phoneE164`) are ALWAYS stripped
 * regardless of this decorator.
 */
export const ExposePhone = () => SetMetadata(EXPOSE_PHONE_KEY, true);
