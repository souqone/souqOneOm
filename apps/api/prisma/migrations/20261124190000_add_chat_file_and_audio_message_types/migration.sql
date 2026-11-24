-- Expand-only migration: ensure AUDIO and FILE exist in MessageType enum.
-- Safe when AUDIO already exists in DB (e.g. from prior prisma db push).
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'AUDIO';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'FILE';
