-- =============================================================================
-- Hikaya — SQL migration for Favorites and Saved Searches
--
-- DiscountCode already exists in the Prisma schema & Supabase.
-- This migration creates the two new tables needed for Feature 3.
-- Run against your Supabase SQL editor or psql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Favorite — users can bookmark creator profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Favorite" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            TEXT NOT NULL,
  "creatorProfileId"  TEXT NOT NULL,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Favorite_userId_creatorProfileId_key" UNIQUE ("userId", "creatorProfileId"),
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Favorite_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId")
    REFERENCES "CreatorProfile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS "Favorite_creatorProfileId_idx" ON "Favorite"("creatorProfileId");

-- Enable RLS (Supabase convention)
ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON "Favorite"
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- SavedSearch — users can save discover filter combinations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SavedSearch" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "name"          TEXT NOT NULL DEFAULT 'Untitled search',
  "filterParams"  JSONB NOT NULL DEFAULT '{}',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- Enable RLS
ALTER TABLE "SavedSearch" ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own saved searches
CREATE POLICY "Users can manage own saved searches"
  ON "SavedSearch"
  USING (true)
  WITH CHECK (true);
