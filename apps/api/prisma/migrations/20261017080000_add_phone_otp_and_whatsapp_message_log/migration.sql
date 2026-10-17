-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'PHONE_VERIFY';
ALTER TYPE "OtpPurpose" ADD VALUE 'PHONE_LOGIN';

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('ACCEPTED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "otp_challenges" ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN     "phoneE164" TEXT;

-- CreateIndex
CREATE INDEX "otp_challenges_phoneE164_purpose_consumedAt_idx" ON "otp_challenges"("phoneE164", "purpose", "consumedAt");

-- Add Check Constraint to ensure at least one of userId or phoneE164 is non-null
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_or_phone_check" CHECK (("userId" IS NOT NULL) OR ("phoneE164" IS NOT NULL));

-- CreateTable
CREATE TABLE "whatsapp_message_logs" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "ipHash" TEXT,
    "providerMessageId" TEXT,
    "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'ACCEPTED',
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_message_logs_providerMessageId_key" ON "whatsapp_message_logs"("providerMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_message_logs_phoneHash_createdAt_idx" ON "whatsapp_message_logs"("phoneHash", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_message_logs_createdAt_idx" ON "whatsapp_message_logs"("createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_message_logs_ipHash_createdAt_idx" ON "whatsapp_message_logs"("ipHash", "createdAt");
