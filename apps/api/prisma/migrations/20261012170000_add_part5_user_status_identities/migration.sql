-- Step 2 (A): Normalize existing usernames to lowercase
UPDATE "users" SET "username" = lower("username") WHERE "username" <> lower("username");

-- Step 2 (B): Check constraint enforcing lowercase username
ALTER TABLE "users" ADD CONSTRAINT "users_username_lower_chk" CHECK ("username" = lower("username"));

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE', 'FACEBOOK');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "phoneE164" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "email" DROP NOT NULL;

-- Step 2 (C): Backfill emailVerifiedAt for already verified users
UPDATE "users" SET "emailVerifiedAt" = "updatedAt" WHERE "isVerified" = true AND "emailVerifiedAt" IS NULL;

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_identities_userId_idx" ON "auth_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_providerUserId_key" ON "auth_identities"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneE164_key" ON "users"("phoneE164");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2 (D): Backfill Google identities from existing googleId
INSERT INTO "auth_identities" (id, "userId", provider, "providerUserId", "createdAt")
SELECT gen_random_uuid()::text, id, 'GOOGLE', "googleId", now()
FROM "users"
WHERE "googleId" IS NOT NULL
ON CONFLICT DO NOTHING;
