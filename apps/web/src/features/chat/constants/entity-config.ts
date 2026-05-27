/**
 * Single source of truth for chat entity labels, badge styles, and deep links.
 */

export const ENTITY_KEYS: Record<string, string> = {
  LISTING: 'entityListing',
  BUS_LISTING: 'entityBusListing',
  SPARE_PART: 'entitySparePart',
  CAR_SERVICE: 'entityCarService',
  JOB: 'entityJob',
  EQUIPMENT_LISTING: 'entityEquipmentListing',
  OPERATOR_LISTING: 'entityOperatorListing',
};

export const ENTITY_BADGE_COLORS: Record<string, string> = {
  LISTING: 'bg-blue-500/10 text-blue-600 border-blue-200',
  BUS_LISTING: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  SPARE_PART: 'bg-amber-500/10 text-amber-700 border-amber-200',
  CAR_SERVICE: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  JOB: 'bg-violet-500/10 text-violet-600 border-violet-200',
  EQUIPMENT_LISTING: 'bg-orange-500/10 text-orange-600 border-orange-200',
  OPERATOR_LISTING: 'bg-teal-500/10 text-teal-600 border-teal-200',
};

/** Returns locale path for the listing/entity, or null when no public page exists. */
export const ENTITY_NAVIGATE: Record<string, (entityId: string) => string | null> = {
  LISTING: (id) => `/sale/car/${id}`,
  BUS_LISTING: (id) => `/sale/bus/${id}`,
  SPARE_PART: (id) => `/sale/part/${id}`,
  CAR_SERVICE: (id) => `/sale/service/${id}`,
  JOB: (id) => `/jobs/${id}`,
  EQUIPMENT_LISTING: (id) => `/sale/equipment/${id}`,
  OPERATOR_LISTING: (id) => `/equipment/operators/${id}`,
};
