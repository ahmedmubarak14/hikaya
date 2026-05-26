-- =============================================================================
-- Migration: Space rental features — house rules, add-ons, check-in/out flow.
--
-- Run via the Supabase SQL Editor after migrate-missing-tables.sql.
-- =============================================================================

-- 1. Space: house rules (free-text, shown on detail page)
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "houseRules" TEXT DEFAULT '';

-- 2. Space: add-ons (JSONB array of { name, priceHalalas })
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "addOns" JSONB DEFAULT '[]'::jsonb;

-- 3. SpaceBooking: check-in / check-out timestamps
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "checkInAt" TIMESTAMPTZ;
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "checkOutAt" TIMESTAMPTZ;

-- 4. SpaceBooking: condition photos at check-in and check-out (text arrays)
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "checkInPhotos" TEXT[] DEFAULT '{}';
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "checkOutPhotos" TEXT[] DEFAULT '{}';

-- 5. SpaceBooking: selected add-ons at booking time (JSONB snapshot)
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "selectedAddOns" JSONB DEFAULT '[]'::jsonb;
