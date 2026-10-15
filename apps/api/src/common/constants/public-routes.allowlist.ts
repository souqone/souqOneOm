/**
 * Temporary registry of routes protected exclusively by AdminApiKeyGuard.
 * These routes are secured via the X-Admin-API-Key header.
 * Note: Scheduled to be removed/deprecated when unified RBAC is introduced in Part 6b.
 * Count: 5 routes.
 */
export const ADMIN_KEY_ROUTES = [
  'GET /admin/payments',
  'GET /admin/payments/stats',
  'GET /admin/payments/metrics',
  'GET /admin/payments/dlq',
  'GET /admin/payments/:paymentId/events',
] as const;

/**
 * Comprehensive allowlist of public API endpoints that do not require mandatory JWT authentication.
 * Includes:
 * - Completely un-guarded public endpoints (54 routes)
 * - OptionalJwtAuthGuard endpoints permitting anonymous browsing (9 routes)
 * - VerificationGuard endpoints for onboarding verification (2 routes)
 * Total: 65 routes.
 */
export const PUBLIC_ROUTES_ALLOWLIST = [
  'GET /health/live',
  'GET /health/ready',
  'POST /auth/signup',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/google',
  'POST /auth/refresh',
  'POST /auth/logout',
  'POST /auth/verify-email',
  'POST /auth/resend-verification',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
  'GET /buses',
  'GET /buses/manufacturers',
  'GET /buses/models',
  'GET /buses/slug/:slug',
  'GET /buses/:id/similar',
  'GET /buses/:id',
  'GET /cars/brands',
  'GET /cars/brands/search',
  'GET /cars/brands/:brandId/models',
  'GET /cars/models/:modelId/years',
  'GET /cars/models/:modelId/trims',
  'GET /cars/filter',
  'GET /cars/full',
  'GET /cars/stats',
  'GET /equipment',
  'GET /equipment/slug/:slug',
  'GET /equipment/:id',
  'GET /jobs',
  'GET /jobs/drivers',
  'GET /jobs/drivers/:id/reviews',
  'GET /jobs/drivers/:id',
  'GET /jobs/employers/:id',
  'GET /jobs/:id',
  'GET /listings',
  'GET /listings/:id',
  'GET /listings/:id/similar',
  'GET /listings/slug/:slug',
  'GET /listings/search/suggestions',
  'GET /locations/governorates',
  'GET /locations/wilayas',
  'GET /notifications/push/vapid-key',
  'GET /operators',
  'GET /operators/:id',
  'GET /parts',
  'GET /parts/:id',
  'GET /payments/verify/:sessionId',
  'POST /payments/webhook',
  'GET /payments/plans',
  'GET /reviews',
  'GET /reviews/summary/:userId',
  'GET /search',
  'GET /search/autocomplete',
  'GET /services',
  'GET /services/slug/:slug',
  'GET /services/:id',
  'GET /transport/carriers',
  'GET /transport/carriers/:id',
  'GET /transport/carriers/:id/reviews',
  'GET /transport/stats',
  'GET /transport/requests',
  'GET /transport/requests/:id',
  'GET /uploads/listings/:listingId/images',
  'GET /users/:id',
] as const;

export type AdminKeyRoute = (typeof ADMIN_KEY_ROUTES)[number];
export type PublicRoute = (typeof PUBLIC_ROUTES_ALLOWLIST)[number];
