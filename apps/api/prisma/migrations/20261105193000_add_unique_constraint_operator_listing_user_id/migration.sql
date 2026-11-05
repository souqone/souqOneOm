-- DropIndex
DROP INDEX IF EXISTS "operator_listings_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "operator_listings_userId_key" ON "operator_listings"("userId");
