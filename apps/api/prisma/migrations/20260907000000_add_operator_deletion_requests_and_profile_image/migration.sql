-- CreateEnum
CREATE TYPE "OperatorDeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_DELETION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_DELETION_REJECTED';

-- AlterTable
ALTER TABLE "operator_listings" ADD COLUMN "profileImageUrl" TEXT,
ALTER COLUMN "wilayaId" SET NOT NULL;

-- CreateTable
CREATE TABLE "operator_deletion_requests" (
    "id" TEXT NOT NULL,
    "operatorListingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "OperatorDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operator_deletion_requests_operatorListingId_idx" ON "operator_deletion_requests"("operatorListingId");

-- CreateIndex
CREATE INDEX "operator_deletion_requests_status_idx" ON "operator_deletion_requests"("status");

-- AddForeignKey
ALTER TABLE "operator_deletion_requests" ADD CONSTRAINT "operator_deletion_requests_operatorListingId_fkey" FOREIGN KEY ("operatorListingId") REFERENCES "operator_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
