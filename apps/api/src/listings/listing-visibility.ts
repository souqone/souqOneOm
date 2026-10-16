import { ListingStatus } from '@prisma/client';
import {
  assertPublicOrOwner,
  VisibilityViewer,
} from '../common/public-visibility';

/**
 * Vertical-agnostic visibility gate delegating to the shared public-visibility engine.
 * Public statuses (ACTIVE, SOLD, RENTED) with hiddenByOwnerStatus === false are visible to everyone;
 * any other status or hidden listing is visible only to its owner, ADMIN, or MODERATOR.
 * Throws 404 otherwise (never 403, so the existence of hidden listings is not revealed).
 */
export function assertEntityVisible(
  entity: {
    status: ListingStatus;
    hiddenByOwnerStatus?: boolean | null;
    deletedAt?: Date | null;
    [key: string]: any;
  },
  ownerId: string,
  viewer?: VisibilityViewer | string | null,
  message = 'الإعلان غير موجود',
): void {
  const model = 'deletedAt' in entity ? 'busListing' : 'listing';
  assertPublicOrOwner(model, entity, ownerId, viewer, message);
}

/** Cars: owner field is `sellerId`. */
export function assertListingVisible(
  listing: {
    status: ListingStatus;
    sellerId: string;
    hiddenByOwnerStatus?: boolean | null;
    [key: string]: any;
  },
  viewer?: VisibilityViewer | string | null,
): void {
  assertEntityVisible(listing, listing.sellerId, viewer);
}
