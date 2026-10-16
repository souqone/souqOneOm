import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { assertEntityVisible, assertListingVisible } from './listing-visibility';

describe('assertEntityVisible (generic owner field)', () => {
  const ownerId = 'owner-1';
  const restricted: ListingStatus[] = [ListingStatus.DRAFT, ListingStatus.ARCHIVED, ListingStatus.SUSPENDED];
  const open: ListingStatus[] = [ListingStatus.ACTIVE, ListingStatus.SOLD, ListingStatus.RENTED];

  open.forEach((status) => {
    it(`public status ${status} is visible to a visitor for listing`, () => {
      expect(() => assertEntityVisible('listing', { status }, ownerId, undefined)).not.toThrow();
    });
    it(`public status ${status} is visible to a visitor for busListing`, () => {
      expect(() => assertEntityVisible('busListing', { status, deletedAt: null }, ownerId, undefined)).not.toThrow();
    });
  });

  restricted.forEach((status) => {
    it(`${status} -> 404 for a visitor`, () => {
      expect(() => assertEntityVisible('listing', { status }, ownerId, undefined)).toThrow(NotFoundException);
    });
    it(`${status} -> 404 for another user`, () => {
      expect(() => assertEntityVisible('listing', { status }, ownerId, 'someone-else')).toThrow(NotFoundException);
    });
    it(`${status} -> visible to its owner`, () => {
      expect(() => assertEntityVisible('listing', { status }, ownerId, ownerId)).not.toThrow();
    });
  });

  it('assertListingVisible (cars) keeps sellerId semantics and explicitly passes listing', () => {
    expect(() => assertListingVisible({ status: ListingStatus.DRAFT, sellerId: ownerId }, ownerId)).not.toThrow();
    expect(() => assertListingVisible({ status: ListingStatus.DRAFT, sellerId: ownerId }, 'x')).toThrow(NotFoundException);
  });
});
