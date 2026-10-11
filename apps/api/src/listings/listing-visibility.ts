import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

const PUBLIC_STATUSES: ListingStatus[] = ['ACTIVE', 'SOLD', 'RENTED'];

/**
 * Vertical-agnostic visibility gate. Public statuses are visible to everyone;
 * any other status is visible only to its owner. Throws 404 otherwise
 * (never 403, so the existence of hidden listings is not revealed).
 */
export function assertEntityVisible(
  entity: { status: ListingStatus },
  ownerId: string,
  viewerId?: string,
  message = 'الإعلان غير موجود',
): void {
  if (PUBLIC_STATUSES.includes(entity.status)) return;
  if (viewerId && viewerId === ownerId) return;
  throw new NotFoundException(message);
}

/** Cars: owner field is `sellerId`. Behaviour unchanged. */
export function assertListingVisible(
  listing: { status: ListingStatus; sellerId: string },
  viewerId?: string,
): void {
  assertEntityVisible(listing, listing.sellerId, viewerId);
}
