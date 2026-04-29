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
