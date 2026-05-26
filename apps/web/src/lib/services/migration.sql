-- ============================================================================
-- Migration: Add services JSONB column to CreatorProfile
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- This adds a JSONB column to store creator service offerings with pricing.
--
-- Shape: [{ "id": "svc_...", "nameEn": "...", "nameAr": "...", "description": "...", "priceHalalas": 450000 }]
-- ============================================================================

ALTER TABLE "CreatorProfile"
  ADD COLUMN IF NOT EXISTS "services" JSONB DEFAULT '[]'::jsonb;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN "CreatorProfile"."services" IS
  'JSONB array of service offerings: [{ id, nameEn, nameAr?, description?, priceHalalas }]';
