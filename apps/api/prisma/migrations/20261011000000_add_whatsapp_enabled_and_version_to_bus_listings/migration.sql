-- AlterTable
ALTER TABLE "bus_listings" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

