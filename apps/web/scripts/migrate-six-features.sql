-- =============================================================================
-- Migration: Six new features — file delivery, product bundles, space access
-- codes, damage deposits, space team accounts, and smart-lock foundation.
--
-- Run via the Supabase SQL Editor after migrate-space-features.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. File Delivery with Signed URLs (Store)
--    OrderItem already has downloadToken and downloadExpiresAt columns.
--    We add an explicit column for the file URL snapshot at purchase time,
--    so the download route doesn't need to join Product.
-- ---------------------------------------------------------------------------
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- ---------------------------------------------------------------------------
-- 2. Product Bundles
--    bundleItems is a JSONB array of product IDs included in the bundle.
--    category gains a new enum value 'BUNDLE'.
-- ---------------------------------------------------------------------------
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bundleItems" JSONB DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. Space: Access Code Delivery
--    accessCode is a 6-digit code auto-generated when the owner confirms.
-- ---------------------------------------------------------------------------
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;

-- ---------------------------------------------------------------------------
-- 4. Space: Damage Deposit Logic
--    depositHalalas on Space, depositStatus on SpaceBooking.
-- ---------------------------------------------------------------------------
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "depositHalalas" INTEGER DEFAULT 0;
ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "depositStatus" TEXT DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- 5. Space: Team Accounts
--    Reuses the StudioMember pattern. SpaceMember links users to spaces.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SpaceMember" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "spaceId"   TEXT NOT NULL REFERENCES "Space"("id") ON DELETE CASCADE,
  "userId"    UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "isAdmin"   BOOLEAN DEFAULT FALSE,
  "joinedAt"  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("spaceId", "userId")
);

-- ---------------------------------------------------------------------------
-- 6. Space: Smart-Lock Foundation
--    smartLockConfig is JSONB: { provider, lockId, apiKey }.
-- ---------------------------------------------------------------------------
ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "smartLockConfig" JSONB DEFAULT NULL;
