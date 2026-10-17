-- CreateEnum
CREATE TYPE "BanBlacklistKind" AS ENUM ('PHONE', 'GOOGLE');

-- CreateTable
CREATE TABLE "ban_blacklist_entries" (
    "id" TEXT NOT NULL,
    "kind" "BanBlacklistKind" NOT NULL,
    "hash" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ban_blacklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ban_blacklist_entries_kind_hash_key" ON "ban_blacklist_entries"("kind", "hash");

-- CreateIndex
CREATE INDEX "ban_blacklist_entries_hash_idx" ON "ban_blacklist_entries"("hash");

-- CreateIndex
CREATE INDEX "ban_blacklist_entries_userId_idx" ON "ban_blacklist_entries"("userId");

-- AddForeignKey
ALTER TABLE "ban_blacklist_entries" ADD CONSTRAINT "ban_blacklist_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
