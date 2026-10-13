-- AlterTable
ALTER TABLE "driver_jobs" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "driver_profiles" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "employer_profiles" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "car_services" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "equipment_listings" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "operator_listings" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "carrier_profiles" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Data backfill: enable WhatsApp where an existing non-empty WhatsApp number is stored
UPDATE "driver_jobs" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "driver_profiles" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "employer_profiles" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "spare_parts" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "car_services" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "equipment_listings" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "operator_listings" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
UPDATE "carrier_profiles" SET "whatsappEnabled" = true WHERE btrim("whatsapp") IS NOT NULL AND btrim("whatsapp") <> '';
