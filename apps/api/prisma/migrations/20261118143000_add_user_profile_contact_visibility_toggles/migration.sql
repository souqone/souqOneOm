-- AlterTable
ALTER TABLE "users" ADD COLUMN     "showPhoneOnProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showWhatsappOnProfile" BOOLEAN NOT NULL DEFAULT false;
