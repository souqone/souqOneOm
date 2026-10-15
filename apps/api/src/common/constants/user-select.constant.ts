import type { Prisma } from '@prisma/client';

/**
 * Single source of truth for Prisma User select objects.
 * Every service MUST import from here — no hardcoded user selects anywhere else.
 */

/** Minimal user info for list/card views — always includes isVerified */
export const USER_SELECT_PUBLIC = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  isVerified: true,
  governorate: true,
} as const satisfies Prisma.UserSelect;

/** Extended user info for detail pages — adds phone + createdAt */
export const USER_SELECT_DETAIL = {
  ...USER_SELECT_PUBLIC,
  phone: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

/** Public seller info for listing detail pages — no phone. */
export const USER_SELECT_LISTING_PUBLIC = {
  ...USER_SELECT_PUBLIC,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

/** Admin verification view — includes email + phone for driver verification review. No password/tokens. */
export const USER_SELECT_ADMIN_VERIFICATION = {
  ...USER_SELECT_PUBLIC,
  email: true,
  phone: true,
} as const satisfies Prisma.UserSelect;

/** Full user profile for public view (e.g. GET /users/:id) */
export const USER_SELECT_PROFILE_PUBLIC = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  country: true,
  governorateId: true,
  wilayaId: true,
  governorateRef: true,
  wilayaRef: true,
  isVerified: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

/** Private user profile for current authenticated user (e.g. GET /users/me, PATCH /users/me) */
export const USER_SELECT_PROFILE_PRIVATE = {
  ...USER_SELECT_PROFILE_PUBLIC,
  role: true,
  email: true,
  phone: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;


