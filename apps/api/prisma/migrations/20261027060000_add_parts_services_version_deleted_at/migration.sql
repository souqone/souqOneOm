-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "car_services" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "spare_parts_deletedAt_idx" ON "spare_parts"("deletedAt");

-- CreateIndex
CREATE INDEX "car_services_deletedAt_idx" ON "car_services"("deletedAt");
