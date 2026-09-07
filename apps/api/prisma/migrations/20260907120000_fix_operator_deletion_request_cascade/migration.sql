-- DropForeignKey
ALTER TABLE "operator_deletion_requests" DROP CONSTRAINT "operator_deletion_requests_operatorListingId_fkey";

-- AlterTable
ALTER TABLE "operator_deletion_requests" ALTER COLUMN "operatorListingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "operator_deletion_requests" ADD CONSTRAINT "operator_deletion_requests_operatorListingId_fkey" FOREIGN KEY ("operatorListingId") REFERENCES "operator_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;