import { ENTITY_TYPES, EntityType } from './entity-types.constants';

export type VisibilityPrismaDelegateName =
  | 'listing'
  | 'busListing'
  | 'equipmentListing'
  | 'operatorListing'
  | 'sparePart'
  | 'carService'
  | 'driverJob'
  | 'driverProfile'
  | 'employerProfile'
  | 'carrierProfile'
  | 'transportRequest';

export interface OwnerVisibilityConfig {
  entityType: EntityType;
  prismaDelegate: VisibilityPrismaDelegateName;
  ownerField: 'userId' | 'sellerId';
  ownerRelation: 'user' | 'seller';
  indexedInMeili: boolean;
  cachePatterns: readonly string[];
}

/**
 * OWNER_VISIBILITY_REGISTRY
 * Central registry defining owner-content relationship and visibility rules
 * across all 11 market entities.
 *
 * Cache patterns strictly match existing service invalidation keys:
 * - Empty array `[]` explicitly denotes verticals with no Redis list/detail caching.
 */
export const OWNER_VISIBILITY_REGISTRY: readonly OwnerVisibilityConfig[] = [
  {
    entityType: ENTITY_TYPES.LISTING,
    prismaDelegate: 'listing',
    ownerField: 'sellerId',
    ownerRelation: 'seller',
    indexedInMeili: true,
    cachePatterns: ['listings:*', 'listing:*'],
  },
  {
    entityType: ENTITY_TYPES.BUS_LISTING,
    prismaDelegate: 'busListing',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: true,
    cachePatterns: [
      'busListing:list:*',
      'busListing:similar:*',
      'busListing:detail:*',
      'busListing:slug:*',
    ],
  },
  {
    entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
    prismaDelegate: 'equipmentListing',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: true,
    cachePatterns: [], // لا يوجد كاش في equipment-listings.service.ts
  },
  {
    entityType: ENTITY_TYPES.OPERATOR_LISTING,
    prismaDelegate: 'operatorListing',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: true,
    cachePatterns: [], // لا يوجد كاش في operators.service.ts
  },
  {
    entityType: ENTITY_TYPES.SPARE_PART,
    prismaDelegate: 'sparePart',
    ownerField: 'sellerId',
    ownerRelation: 'seller',
    indexedInMeili: true,
    cachePatterns: [], // لا يوجد كاش في parts.service.ts
  },
  {
    entityType: ENTITY_TYPES.CAR_SERVICE,
    prismaDelegate: 'carService',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: true,
    cachePatterns: ['carService:list:*', 'carService:detail:*'],
  },
  {
    entityType: ENTITY_TYPES.JOB,
    prismaDelegate: 'driverJob',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: true,
    cachePatterns: ['jobs:list:*', 'jobs:detail:*'],
  },
  {
    entityType: ENTITY_TYPES.DRIVER_PROFILE,
    prismaDelegate: 'driverProfile',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: false,
    cachePatterns: [], // لا يوجد كاش في driver-profile.service.ts
  },
  {
    entityType: ENTITY_TYPES.EMPLOYER_PROFILE,
    prismaDelegate: 'employerProfile',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: false,
    cachePatterns: [], // لا يوجد كاش في employer-profile.service.ts
  },
  {
    entityType: ENTITY_TYPES.CARRIER_PROFILE,
    prismaDelegate: 'carrierProfile',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: false,
    cachePatterns: [], // لا يوجد كاش في carrier-profile.service.ts
  },
  {
    entityType: ENTITY_TYPES.TRANSPORT_REQUEST,
    prismaDelegate: 'transportRequest',
    ownerField: 'userId',
    ownerRelation: 'user',
    indexedInMeili: false,
    cachePatterns: ['transport:list:*', 'transport:request:*'],
  },
] as const;
