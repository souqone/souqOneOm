/**
 * Transactional advisory lock ID used across admin operations to synchronize
 * critical sections (e.g. promoting the initial admin or preventing last-admin demotion).
 * Pure constant with zero NestJS or external dependencies.
 */
export const LAST_ADMIN_ADVISORY_LOCK_ID = 742910385;
