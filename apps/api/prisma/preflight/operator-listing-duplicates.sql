-- apps/api/prisma/preflight/operator-listing-duplicates.sql
-- Preflight duplicate check for OperatorListing.userId unique constraint (D-222)
-- Read-only query: reports user IDs with duplicate operator listings and counts.
-- No PII or personal data is returned.

SELECT
  "userId",
  COUNT(*) AS listing_count
FROM "operator_listings"
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY listing_count DESC;
