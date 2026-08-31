-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN IF NOT EXISTS "hasWarranty" BOOLEAN;
ALTER TABLE "spare_parts" ADD COLUMN IF NOT EXISTS "warrantyDuration" TEXT;
ALTER TABLE "spare_parts" ADD COLUMN IF NOT EXISTS "quantity" TEXT;
ALTER TABLE "spare_parts" ADD COLUMN IF NOT EXISTS "compatibleVehicleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];