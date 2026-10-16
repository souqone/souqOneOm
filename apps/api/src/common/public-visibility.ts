import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { VisibilityPrismaDelegateName } from './constants/owner-visibility.registry';

export const PUBLIC_LISTING_STATUSES: readonly ListingStatus[] = [
  'ACTIVE',
  'SOLD',
  'RENTED',
] as const;

/**
 * Models governed by ListingStatus enum in schema.prisma.
 */
export const LISTING_STATUS_MODELS: readonly VisibilityPrismaDelegateName[] = [
  'listing',
  'busListing',
  'equipmentListing',
  'operatorListing',
  'sparePart',
  'carService',
] as const;

export interface VisibilityViewer {
  sub?: string;
  role?: string;
}

/**
 * Builds the where clause condition for public lists across all 11 models.
 * Rule: Adds hiddenByOwnerStatus: false (and deletedAt: null for busListing).
 * Does NOT alter or enforce status filters here, preserving each vertical's existing list queries.
 */
export function getPublicListBaseCondition(
  model: VisibilityPrismaDelegateName,
): Record<string, any> {
  if (model === 'busListing') {
    return {
      hiddenByOwnerStatus: false,
      deletedAt: null,
    };
  }
  return {
    hiddenByOwnerStatus: false,
  };
}

/**
 * Safely merges the public list condition with an existing Prisma where clause.
 * Uses AND array so existing keys or existing AND clauses are preserved without overwriting.
 */
export function buildPublicVisibilityWhere<T extends Record<string, any>>(
  model: VisibilityPrismaDelegateName,
  existingWhere?: T,
): T & { AND?: any[] } {
  const baseCondition = getPublicListBaseCondition(model);

  if (!existingWhere || Object.keys(existingWhere).length === 0) {
    return { ...baseCondition } as any;
  }

  const existingAnd = Array.isArray(existingWhere.AND)
    ? existingWhere.AND
    : existingWhere.AND
      ? [existingWhere.AND]
      : [];

  return {
    ...existingWhere,
    AND: [...existingAnd, baseCondition],
  };
}

/**
 * Checks if an individual entity record is publicly visible.
 *
 * For ListingStatus models (listing, busListing, equipmentListing, operatorListing, sparePart, carService):
 * - Must NOT be hiddenByOwnerStatus
 * - For busListing: deletedAt must be null
 * - status must be in PUBLIC_LISTING_STATUSES ('ACTIVE', 'SOLD', 'RENTED')
 *
 * For other models (driverJob, driverProfile, employerProfile, carrierProfile, transportRequest):
 * - Must NOT be hiddenByOwnerStatus
 */
export function isEntityPubliclyVisible(
  model: VisibilityPrismaDelegateName,
  entity: {
    status?: string | null;
    hiddenByOwnerStatus?: boolean | null;
    deletedAt?: Date | null;
    [key: string]: any;
  } | null | undefined,
): boolean {
  if (!entity) return false;

  // 1. Any entity hidden by owner status is strictly not visible to the public
  if (entity.hiddenByOwnerStatus === true) {
    return false;
  }

  // 2. Soft-deleted bus listing is not visible to the public
  if (model === 'busListing' && entity.deletedAt != null) {
    return false;
  }

  // 3. Status check for ListingStatus models
  if (LISTING_STATUS_MODELS.includes(model)) {
    if (!entity.status) return false;
    return PUBLIC_LISTING_STATUSES.includes(entity.status as ListingStatus);
  }

  // 4. For remaining models (driverJob, driverProfile, employerProfile, carrierProfile, transportRequest)
  return true;
}

/**
 * Detail Page Visibility Gate:
 * Throws NotFoundException (never 403) if the entity is not visible to public.
 *
 * Exceptions:
 * - Owner (viewer.sub === ownerId) can view regardless of status or hiddenByOwnerStatus.
 * - ADMIN and MODERATOR can view regardless of status or hiddenByOwnerStatus.
 */
export function assertPublicOrOwner(
  model: VisibilityPrismaDelegateName,
  entity: any,
  ownerId: string,
  viewer?: VisibilityViewer | string | null,
  notFoundMessage = 'العنصر غير موجود',
): void {
  const viewerId = typeof viewer === 'string' ? viewer : viewer?.sub;
  const viewerRole = typeof viewer === 'object' ? viewer?.role : undefined;

  // 1. Owner can always view
  if (viewerId && viewerId === ownerId) {
    return;
  }

  // 2. Admin & Moderator can always view
  if (viewerRole === 'ADMIN' || viewerRole === 'MODERATOR') {
    return;
  }

  // 3. Otherwise entity must satisfy public visibility
  if (!isEntityPubliclyVisible(model, entity)) {
    throw new NotFoundException(notFoundMessage);
  }
}
