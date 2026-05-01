export const LISTING_EVENTS = {
  CREATED: 'listing.created',
  UPDATED: 'listing.updated',
  DELETED: 'listing.deleted',
  STATUS_CHANGED: 'listing.status_changed',
} as const;

export interface ListingEventPayload {
  /** Entity type e.g. 'CAR_SERVICE', 'TRANSPORT', 'TRIP' */
  entityType: string;
  /** Listing ID */
  listingId: string;
  /** Listing title */
  title: string;
  /** Owner user ID */
  userId: string;
  /** New status (for status_changed event) */
  status?: string;
}
