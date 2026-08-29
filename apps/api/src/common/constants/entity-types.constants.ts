/**
 * ENTITY_TYPES — Single source of truth for all entityType strings
 * used across OutboxEvent, Favorites, Chat, Notifications, Search, and Payments.
 *
 * Rules:
 * - Never use raw strings for entityType anywhere in the codebase
 * - Always import from this file
 * - Adding a new vertical = add it here first
 */
export const ENTITY_TYPES = {
  // Marketplace verticals
  LISTING:           'LISTING',           // Cars
  BUS_LISTING:       'BUS_LISTING',       // Buses
  EQUIPMENT_LISTING: 'EQUIPMENT_LISTING', // Equipment
  OPERATOR_LISTING:  'OPERATOR_LISTING',  // Operators
  SPARE_PART:        'SPARE_PART',        // Parts
  CAR_SERVICE:       'CAR_SERVICE',       // Services
  JOB:               'JOB',               // Jobs

  // Supporting entities
  JOB_APPLICATION:   'JOB_APPLICATION',
  TRANSPORT_REQUEST: 'TRANSPORT_REQUEST',
  TRANSPORT_BOOKING: 'TRANSPORT_BOOKING',
  DRIVER_PROFILE:    'DRIVER_PROFILE',
  EMPLOYER_PROFILE:  'EMPLOYER_PROFILE',
  CARRIER_PROFILE:   'CARRIER_PROFILE',
  ROOM:              'ROOM',
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];
