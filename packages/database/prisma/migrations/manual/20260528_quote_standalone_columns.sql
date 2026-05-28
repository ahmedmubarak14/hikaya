-- Allow standalone quotes — not all quotes are tied to a Booking.
-- Adds self-contained client identity columns so the action doesn't need a
-- Booking row first. Older rows tied to a Booking continue to work; new
-- standalone rows can carry the client name / email directly.

ALTER TABLE "Quote" ALTER COLUMN "bookingId" DROP NOT NULL;

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "creatorId" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "shareSlug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_shareSlug_key" ON "Quote"("shareSlug")
  WHERE "shareSlug" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Quote_creatorId_idx" ON "Quote"("creatorId");
