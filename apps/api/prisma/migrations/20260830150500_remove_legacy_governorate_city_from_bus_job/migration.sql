-- DropIndex
DROP INDEX "bus_listings_governorate_idx";
DROP INDEX "driver_jobs_governorate_idx";

-- AlterTable
ALTER TABLE "bus_listings" DROP COLUMN "city",
DROP COLUMN "governorate";

-- AlterTable
ALTER TABLE "driver_jobs" DROP COLUMN "city",
DROP COLUMN "governorate";
