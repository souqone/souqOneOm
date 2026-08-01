-- Remove Transport Service
-- Drop FK from bookings
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_transportServiceId_fkey";
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "transportServiceId";

-- Drop transport_images table
DROP TABLE IF EXISTS "transport_images";

-- Drop transport_services table
DROP TABLE IF EXISTS "transport_services";

-- Drop enums
DROP TYPE IF EXISTS "TransportType";
DROP TYPE IF EXISTS "PricingType";
