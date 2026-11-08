-- CreateIndex (reordered first so duplicate data aborts migration before dropping the existing index)
CREATE UNIQUE INDEX "operator_listings_userId_key" ON "operator_listings"("userId");

-- DropIndex (only dropped after unique index is safely created)
DROP INDEX IF EXISTS "operator_listings_userId_idx";
