-- AlterTable
ALTER TABLE "listings" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bus_listings" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "equipment_listings" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "operator_listings" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "car_services" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "driver_jobs" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "driver_profiles" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "employer_profiles" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "carrier_profiles" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transport_requests" ADD COLUMN "hiddenByOwnerStatus" BOOLEAN NOT NULL DEFAULT false;
