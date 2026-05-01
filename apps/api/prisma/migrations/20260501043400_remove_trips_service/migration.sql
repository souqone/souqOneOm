ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_tripServiceId_fkey";
DROP INDEX IF EXISTS "bookings_tripServiceId_idx";
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "tripServiceId";

DROP TABLE IF EXISTS "trip_images";
DROP TABLE IF EXISTS "trip_services";

DROP TYPE IF EXISTS "TripType";
DROP TYPE IF EXISTS "ScheduleType";
