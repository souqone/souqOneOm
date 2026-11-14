-- ============================================================================
-- P1-02 Geo Backfill Script (PostGIS geography Point(4326))
-- ============================================================================
-- تنبيه مهم: للتشغيل اليدوي فقط بعد مراجعة محمود وموافقته الصريحة.
-- غير مُنفّذ تلقائياً ولا يتبع Prisma migrations.
--
-- MANUAL EXECUTION ONLY — DO NOT RUN AUTOMATICALLY IN CI OR MIGRATIONS.
-- Review counts before running in psql within a transaction.
--
-- Scope based on GeoService ALLOWED_TABLES + schema.prisma + add-postgis.ts:
--   Tables WITH scalar coordinates + PostGIS column:
--     1. listings            (latitude, longitude -> location)
--     2. spare_parts         (latitude, longitude -> location)
--     3. car_services        (latitude, longitude -> location)
--     4. bus_listings        (latitude, longitude -> location)
--     5. equipment_listings  (latitude, longitude -> location)
--     6. operator_listings   (latitude, longitude -> location)
--     7. transport_requests  (fromLatitude/fromLat, fromLongitude/fromLng -> fromLocation)
--                            (toLatitude/toLat, toLongitude/toLng -> toLocation)
--
--   Tables in ALLOWED_TABLES WITHOUT scalar latitude/longitude columns in schema.prisma
--   (populated only at request time via GeoService.syncLocation, cannot backfill from row columns):
--     - users
--     - driver_jobs
--     - driver_profiles
--     - employer_profiles
--     - carrier_profiles
-- ============================================================================

BEGIN;

-- 1. listings (Cars)
UPDATE "listings"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 2. spare_parts (Parts)
UPDATE "spare_parts"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 3. car_services (Services)
UPDATE "car_services"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 4. bus_listings (Buses)
UPDATE "bus_listings"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 5. equipment_listings (Equipment)
UPDATE "equipment_listings"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 6. operator_listings (Operators)
UPDATE "operator_listings"
SET "location" = ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)
WHERE "location" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

-- 7a. transport_requests (fromLocation)
UPDATE "transport_requests"
SET "fromLocation" = ST_SetSRID(
  ST_MakePoint(
    COALESCE("fromLongitude", "fromLng")::float8,
    COALESCE("fromLatitude", "fromLat")::float8
  ),
  4326
)
WHERE "fromLocation" IS NULL
  AND COALESCE("fromLatitude", "fromLat") IS NOT NULL
  AND COALESCE("fromLongitude", "fromLng") IS NOT NULL
  AND COALESCE("fromLatitude", "fromLat") BETWEEN -90 AND 90
  AND COALESCE("fromLongitude", "fromLng") BETWEEN -180 AND 180;

-- 7b. transport_requests (toLocation)
UPDATE "transport_requests"
SET "toLocation" = ST_SetSRID(
  ST_MakePoint(
    COALESCE("toLongitude", "toLng")::float8,
    COALESCE("toLatitude", "toLat")::float8
  ),
  4326
)
WHERE "toLocation" IS NULL
  AND COALESCE("toLatitude", "toLat") IS NOT NULL
  AND COALESCE("toLongitude", "toLng") IS NOT NULL
  AND COALESCE("toLatitude", "toLat") BETWEEN -90 AND 90
  AND COALESCE("toLongitude", "toLng") BETWEEN -180 AND 180;

COMMIT;
