import { SetMetadata } from '@nestjs/common';

export const EXPOSE_PHONE_KEY = 'exposePhone';
export const EXPOSE_PROFILE_CONTACT_KEY = 'exposeProfileContact';

/**
 * Decorator to explicitly allow exposing the user `phone` field in API responses.
 * Routes without this decorator will have `phone` stripped recursively by SanitizeInterceptor.
 * Note: Legacy contact fields (`contactPhone`, `whatsapp`, `phoneE164`) are ALWAYS stripped
 * regardless of this decorator.
 */
export const ExposePhone = () => SetMetadata(EXPOSE_PHONE_KEY, true);

/**
 * Decorator for public profile routes (GET /users/:id) where the service layer
 * explicitly gates `phone` and `whatsapp` behind the user's opt-in booleans
 * (`showPhoneOnProfile`, `showWhatsappOnProfile`).
 */
export const ExposeProfileContact = () => SetMetadata(EXPOSE_PROFILE_CONTACT_KEY, true);
