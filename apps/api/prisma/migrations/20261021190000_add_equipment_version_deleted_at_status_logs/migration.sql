-- AlterTable
ALTER TABLE "equipment_listings" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "equipment_listing_status_logs" (
    "id" TEXT NOT NULL,
    "fromStatus" "ListingStatus" NOT NULL,
    "toStatus" "ListingStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "equipmentListingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_listing_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_listing_status_logs_equipmentListingId_idx" ON "equipment_listing_status_logs"("equipmentListingId");

-- CreateIndex
CREATE INDEX "equipment_listings_deletedAt_idx" ON "equipment_listings"("deletedAt");

-- CreateIndex
CREATE INDEX "equipment_listings_equipmentType_listingType_status_created_idx" ON "equipment_listings"("equipmentType", "listingType", "status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "equipment_listing_status_logs" ADD CONSTRAINT "equipment_listing_status_logs_equipmentListingId_fkey" FOREIGN KEY ("equipmentListingId") REFERENCES "equipment_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
