import { NotFoundException } from '@nestjs/common';
import {
  buildPublicVisibilityWhere,
  getPublicListBaseCondition,
  isEntityPubliclyVisible,
  assertPublicOrOwner,
  LISTING_STATUS_MODELS,
  PUBLIC_LISTING_STATUSES,
} from './public-visibility';
import { VisibilityPrismaDelegateName } from './constants/owner-visibility.registry';

describe('public-visibility Helper', () => {
  const all11Models: VisibilityPrismaDelegateName[] = [
    'listing',
    'busListing',
    'equipmentListing',
    'operatorListing',
    'sparePart',
    'carService',
    'driverJob',
    'driverProfile',
    'employerProfile',
    'carrierProfile',
    'transportRequest',
  ];

  describe('getPublicListBaseCondition & buildPublicVisibilityWhere', () => {
    it.each(all11Models)('should build correct list base condition for %s', (model) => {
      const condition = getPublicListBaseCondition(model);
      expect(condition.hiddenByOwnerStatus).toBe(false);

      if (model === 'busListing') {
        expect(condition.deletedAt).toBeNull();
      } else {
        expect(condition.deletedAt).toBeUndefined();
      }
    });

    it('should return base condition when existingWhere is undefined or empty', () => {
      const res1 = buildPublicVisibilityWhere('listing');
      expect(res1).toEqual({ hiddenByOwnerStatus: false });

      const res2 = buildPublicVisibilityWhere('busListing', {});
      expect(res2).toEqual({ hiddenByOwnerStatus: false, deletedAt: null });
    });

    it('should merge without overwriting existing keys', () => {
      const existing = { status: 'ACTIVE', make: 'Toyota' };
      const res = buildPublicVisibilityWhere('listing', existing);

      expect(res.status).toBe('ACTIVE');
      expect(res.make).toBe('Toyota');
      expect(res.AND).toEqual([{ hiddenByOwnerStatus: false }]);
    });

    it('should append to existing AND array if present', () => {
      const existing = {
        status: 'ACTIVE',
        AND: [{ price: { gte: 1000 } }],
      };
      const res = buildPublicVisibilityWhere('listing', existing);

      expect(res.status).toBe('ACTIVE');
      expect(res.AND).toEqual([
        { price: { gte: 1000 } },
        { hiddenByOwnerStatus: false },
      ]);
    });
  });

  describe('isEntityPubliclyVisible', () => {
    it('returns false for null or undefined entity', () => {
      expect(isEntityPubliclyVisible('listing', null)).toBe(false);
      expect(isEntityPubliclyVisible('driverJob', undefined)).toBe(false);
    });

    it.each(all11Models)(
      'returns false when hiddenByOwnerStatus is true for %s',
      (model) => {
        const entity = {
          status: 'ACTIVE',
          hiddenByOwnerStatus: true,
          deletedAt: null,
        };
        expect(isEntityPubliclyVisible(model, entity)).toBe(false);
      },
    );

    it('returns false for busListing when deletedAt is set even if active', () => {
      const entity = {
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
        deletedAt: new Date(),
      };
      expect(isEntityPubliclyVisible('busListing', entity)).toBe(false);
    });

    describe('ListingStatus models (listing, busListing, equipmentListing, operatorListing, sparePart, carService)', () => {
      it.each(LISTING_STATUS_MODELS)(
        'returns true for public statuses (ACTIVE, SOLD, RENTED) on %s when not hidden',
        (model) => {
          for (const status of PUBLIC_LISTING_STATUSES) {
            expect(
              isEntityPubliclyVisible(model, {
                status,
                hiddenByOwnerStatus: false,
                deletedAt: null,
              }),
            ).toBe(true);
          }
        },
      );

      it.each(LISTING_STATUS_MODELS)(
        'returns false for non-public statuses (DRAFT, ARCHIVED, SUSPENDED) on %s',
        (model) => {
          const nonPublic = ['DRAFT', 'ARCHIVED', 'SUSPENDED'];
          for (const status of nonPublic) {
            expect(
              isEntityPubliclyVisible(model, {
                status,
                hiddenByOwnerStatus: false,
                deletedAt: null,
              }),
            ).toBe(false);
          }
        },
      );
    });

    describe('Non-ListingStatus models (driverJob, driverProfile, employerProfile, carrierProfile, transportRequest)', () => {
      const otherModels: VisibilityPrismaDelegateName[] = [
        'driverJob',
        'driverProfile',
        'employerProfile',
        'carrierProfile',
        'transportRequest',
      ];

      it.each(otherModels)(
        'returns true when hiddenByOwnerStatus is false on %s regardless of other fields',
        (model) => {
          expect(
            isEntityPubliclyVisible(model, {
              hiddenByOwnerStatus: false,
            }),
          ).toBe(true);

          expect(
            isEntityPubliclyVisible(model, {
              status: 'CLOSED', // for driverJob, still true if not hidden
              hiddenByOwnerStatus: false,
            }),
          ).toBe(true);
        },
      );
    });
  });

  describe('assertPublicOrOwner', () => {
    const ownerId = 'user-owner-123';
    const otherUserId = 'user-other-456';

    const hiddenListing = {
      id: 'listing-1',
      status: 'ACTIVE',
      hiddenByOwnerStatus: true,
      sellerId: ownerId,
    };

    const draftListing = {
      id: 'listing-2',
      status: 'DRAFT',
      hiddenByOwnerStatus: false,
      sellerId: ownerId,
    };

    const activeListing = {
      id: 'listing-3',
      status: 'ACTIVE',
      hiddenByOwnerStatus: false,
      sellerId: ownerId,
    };

    it('allows owner to view hidden or draft item', () => {
      expect(() =>
        assertPublicOrOwner('listing', hiddenListing, ownerId, { sub: ownerId }),
      ).not.toThrow();

      expect(() =>
        assertPublicOrOwner('listing', draftListing, ownerId, ownerId),
      ).not.toThrow();
    });

    it('allows ADMIN to view hidden or draft item', () => {
      expect(() =>
        assertPublicOrOwner('listing', hiddenListing, ownerId, {
          sub: otherUserId,
          role: 'ADMIN',
        }),
      ).not.toThrow();

      expect(() =>
        assertPublicOrOwner('listing', draftListing, ownerId, {
          sub: otherUserId,
          role: 'ADMIN',
        }),
      ).not.toThrow();
    });

    it('allows MODERATOR to view hidden or draft item', () => {
      expect(() =>
        assertPublicOrOwner('listing', hiddenListing, ownerId, {
          sub: otherUserId,
          role: 'MODERATOR',
        }),
      ).not.toThrow();
    });

    it('throws NotFoundException for anonymous visitor if item is hidden', () => {
      expect(() =>
        assertPublicOrOwner('listing', hiddenListing, ownerId, undefined),
      ).toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-owner regular user if item is hidden', () => {
      expect(() =>
        assertPublicOrOwner('listing', hiddenListing, ownerId, {
          sub: otherUserId,
          role: 'USER',
        }),
      ).toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-owner regular user if item is DRAFT', () => {
      expect(() =>
        assertPublicOrOwner('listing', draftListing, ownerId, {
          sub: otherUserId,
          role: 'USER',
        }),
      ).toThrow(NotFoundException);
    });

    it('allows anyone to view active publicly visible item', () => {
      expect(() =>
        assertPublicOrOwner('listing', activeListing, ownerId, undefined),
      ).not.toThrow();

      expect(() =>
        assertPublicOrOwner('listing', activeListing, ownerId, {
          sub: otherUserId,
          role: 'USER',
        }),
      ).not.toThrow();
    });
  });
});
