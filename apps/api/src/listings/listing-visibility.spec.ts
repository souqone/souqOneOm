import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { assertListingVisible } from './listing-visibility';

describe('assertListingVisible', () => {
  const sellerId = 'seller-user-1';
  const otherViewerId = 'other-user-2';

  const publicStatuses: ListingStatus[] = [
    ListingStatus.ACTIVE,
    ListingStatus.SOLD,
    ListingStatus.RENTED,
  ];

  const restrictedStatuses: ListingStatus[] = [
    ListingStatus.DRAFT,
    ListingStatus.ARCHIVED,
    ListingStatus.SUSPENDED,
  ];

  describe('Public statuses (ACTIVE, SOLD, RENTED) - 9 matrix cases', () => {
    publicStatuses.forEach((status) => {
      it(`allows public viewing without viewerId for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, undefined),
        ).not.toThrow();
      });

      it(`allows viewing by another user for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, otherViewerId),
        ).not.toThrow();
      });

      it(`allows viewing by owner for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, sellerId),
        ).not.toThrow();
      });
    });
  });

  describe('Restricted statuses (DRAFT, ARCHIVED, SUSPENDED) - 9 matrix cases', () => {
    restrictedStatuses.forEach((status) => {
      it(`throws NotFoundException without viewerId for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, undefined),
        ).toThrow(NotFoundException);
        expect(() =>
          assertListingVisible({ status, sellerId }, undefined),
        ).toThrow('الإعلان غير موجود');
      });

      it(`throws NotFoundException for another viewer for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, otherViewerId),
        ).toThrow(NotFoundException);
        expect(() =>
          assertListingVisible({ status, sellerId }, otherViewerId),
        ).toThrow('الإعلان غير موجود');
      });

      it(`allows owner to view their own listing for status=${status}`, () => {
        expect(() =>
          assertListingVisible({ status, sellerId }, sellerId),
        ).not.toThrow();
      });
    });
  });
});
