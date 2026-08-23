/**
 * Database cleanup utility for E2E tests.
 * Truncates all transactional tables using raw SQL TRUNCATE CASCADE.
 * Uses the actual PostgreSQL table names (from @@map in schema.prisma).
 */
import { PrismaService } from '../src/prisma/prisma.service';

// Actual SQL table names (from @@map directives in schema.prisma).
// TRUNCATE CASCADE handles FK constraints automatically.
const TABLES_TO_TRUNCATE = [
  // Child / Junction / Log tables (leaf tables)
  'message_reactions',
  'conversation_participants',
  'messages',
  'listing_images',
  'spare_part_images',
  'car_service_images',
  'bus_listing_images',
  'bus_listing_price_history',
  'bus_listing_status_logs',
  'equipment_listing_images',
  'review_replies',
  'reviews',
  'payment_events',
  'payments',
  'subscriptions',
  'transport_bookings',
  'transport_quotes',
  'transport_requests',
  'job_applications',
  'driver_verifications',
  'favorites',
  'notifications',
  'push_subscriptions',
  'push_tokens',
  'login_audits',
  'refresh_tokens',

  // Profile tables
  'driver_profiles',
  'employer_profiles',
  'carrier_profiles',

  // Core feature tables
  'driver_jobs',
  'spare_parts',
  'car_services',
  'bus_listings',
  'equipment_listings',
  'operator_listings',
  'listings',
  'conversations',

  // Users (parent of everything)
  'users',

  // Note: Static seeded lookup tables are preserved:
  // governorates, wilayas, brands, car_models, car_years, car_trims,
  // bus_manufacturers, bus_models
];

/**
 * Truncate all application tables using TRUNCATE CASCADE.
 * This is fast and handles FK constraints automatically.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  const tableNames = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
  
  // Set lock timeout to 5 seconds to prevent indefinite deadlocks,
  // then attempt TRUNCATE with retries to handle lingering background connections
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$executeRawUnsafe(`SET LOCAL lock_timeout = '5s';`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
      break; // Success
    } catch (err: any) {
      if (i === maxRetries - 1) throw err;
      console.warn(`\n   ⚠ TRUNCATE lock timeout or deadlock (attempt ${i + 1}/${maxRetries}), retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const gov = await prisma.governorate.findUnique({ where: { id: 1 } });
  if (!gov) {
    await prisma.governorate.create({
      data: {
        id: 1,
        nameAr: 'مسقط',
        nameEn: 'Muscat',
        wilayas: {
          create: [{ id: 1, nameAr: 'السيب', nameEn: 'Seeb' }],
        },
      },
    });
  }
}
