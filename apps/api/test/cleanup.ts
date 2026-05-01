/**
 * Database cleanup utility for E2E tests.
 * Truncates all tables using raw SQL TRUNCATE CASCADE.
 * Uses the actual PostgreSQL table names (from @@map in schema.prisma).
 */
import { PrismaService } from '../src/prisma/prisma.service';

// Actual SQL table names (from @@map directives in schema.prisma).
// TRUNCATE CASCADE handles FK constraints automatically.
const TABLES_TO_TRUNCATE = [
  // Reactions / images (leaf tables)
  'message_reactions',
  'spare_part_images',
  'car_service_images',
  'transport_images',
  'listing_images',
  'bus_listing_images',
  'equipment_listing_images',

  // Messages & chat participants
  'messages',
  'conversation_participants',

  // Escrow, verifications & invites
  'job_escrows',
  'driver_verifications',
  'job_invites',

  // Job profiles
  'driver_profiles',
  'employer_profiles',

  // Job applications
  'job_applications',

  // Bookings
  'bookings',

  // Equipment bids
  'equipment_bids',

  // Favorites & notifications
  'favorites',
  'notifications',

  // Conversations
  'conversations',

  // Content tables
  'transport_services',
  'car_services',
  'spare_parts',
  'driver_jobs',
  'bus_listings',
  'equipment_requests',
  'equipment_listings',
  'operator_listings',
  'listings',

  // Auth tokens
  'refresh_tokens',

  // Users (parent of everything)
  'users',

  // Car data (independent, seeded — don't truncate by default)
  // 'car_years',
  // 'car_models',
  // 'brands',
];

/**
 * Truncate all application tables using TRUNCATE CASCADE.
 * This is fast (~10ms) and handles FK constraints automatically.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  const tableNames = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
}
