-- Batch 2 (Spaces booking core): half-day rate + per-space cancellation policy.
-- The Space / SpaceBooking tables are managed out-of-band (not in the Prisma
-- schema yet); these columns are additive and safe to run repeatedly.

ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "halfDayHalalas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT;
