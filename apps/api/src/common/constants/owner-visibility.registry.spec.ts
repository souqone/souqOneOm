import {
  OWNER_VISIBILITY_REGISTRY,
  OwnerVisibilityConfig,
} from './owner-visibility.registry';
import { ENTITY_TYPES } from './entity-types.constants';

describe('OwnerVisibilityRegistry', () => {
  it('should contain all 11 defined entities', () => {
    expect(OWNER_VISIBILITY_REGISTRY).toHaveLength(11);
  });

  it('should cover the expected unique entity types', () => {
    const expectedTypes = [
      ENTITY_TYPES.LISTING,
      ENTITY_TYPES.BUS_LISTING,
      ENTITY_TYPES.EQUIPMENT_LISTING,
      ENTITY_TYPES.OPERATOR_LISTING,
      ENTITY_TYPES.SPARE_PART,
      ENTITY_TYPES.CAR_SERVICE,
      ENTITY_TYPES.JOB,
      ENTITY_TYPES.DRIVER_PROFILE,
      ENTITY_TYPES.EMPLOYER_PROFILE,
      ENTITY_TYPES.CARRIER_PROFILE,
      ENTITY_TYPES.TRANSPORT_REQUEST,
    ];

    const actualTypes = OWNER_VISIBILITY_REGISTRY.map((c) => c.entityType);
    expect(actualTypes.sort()).toEqual(expectedTypes.sort());
  });

  it('should configure sellerId for Listing and SparePart, and userId for the rest', () => {
    for (const config of OWNER_VISIBILITY_REGISTRY) {
      if (
        config.entityType === ENTITY_TYPES.LISTING ||
        config.entityType === ENTITY_TYPES.SPARE_PART
      ) {
        expect(config.ownerField).toBe('sellerId');
        expect(config.ownerRelation).toBe('seller');
      } else {
        expect(config.ownerField).toBe('userId');
        expect(config.ownerRelation).toBe('user');
      }
    }
  });

  it('should have indexedInMeili=true for exactly 7 verticals and false for 4 profiles/requests', () => {
    const meiliIndexed = OWNER_VISIBILITY_REGISTRY.filter((c) => c.indexedInMeili);
    const nonIndexed = OWNER_VISIBILITY_REGISTRY.filter((c) => !c.indexedInMeili);

    expect(meiliIndexed).toHaveLength(7);
    expect(nonIndexed).toHaveLength(4);

    const indexedTypes = meiliIndexed.map((c) => c.entityType).sort();
    expect(indexedTypes).toEqual([
      ENTITY_TYPES.BUS_LISTING,
      ENTITY_TYPES.CAR_SERVICE,
      ENTITY_TYPES.EQUIPMENT_LISTING,
      ENTITY_TYPES.JOB,
      ENTITY_TYPES.LISTING,
      ENTITY_TYPES.OPERATOR_LISTING,
      ENTITY_TYPES.SPARE_PART,
    ].sort());
  });

  it('should provide empty cache patterns for verticals without Redis caches', () => {
    const noCacheVerticals = [
      ENTITY_TYPES.EQUIPMENT_LISTING,
      ENTITY_TYPES.OPERATOR_LISTING,
      ENTITY_TYPES.SPARE_PART,
      ENTITY_TYPES.DRIVER_PROFILE,
      ENTITY_TYPES.EMPLOYER_PROFILE,
      ENTITY_TYPES.CARRIER_PROFILE,
    ];

    for (const type of noCacheVerticals) {
      const config = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === type);
      expect(config?.cachePatterns).toEqual([]);
    }
  });

  it('should have exact known cache patterns for verticals with caching', () => {
    const listing = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === ENTITY_TYPES.LISTING);
    expect(listing?.cachePatterns).toEqual(['listings:*', 'listing:*']);

    const bus = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === ENTITY_TYPES.BUS_LISTING);
    expect(bus?.cachePatterns).toEqual([
      'busListing:list:*',
      'busListing:similar:*',
      'busListing:detail:*',
      'busListing:slug:*',
    ]);

    const service = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === ENTITY_TYPES.CAR_SERVICE);
    expect(service?.cachePatterns).toEqual(['carService:list:*', 'carService:detail:*']);

    const job = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === ENTITY_TYPES.JOB);
    expect(job?.cachePatterns).toEqual(['jobs:list:*', 'jobs:detail:*']);

    const transport = OWNER_VISIBILITY_REGISTRY.find((c) => c.entityType === ENTITY_TYPES.TRANSPORT_REQUEST);
    expect(transport?.cachePatterns).toEqual(['transport:list:*', 'transport:request:*']);
  });
});
