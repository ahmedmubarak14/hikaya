-- =============================================================================
-- Hikaya — SQL migration for CRM, Templates, Availability, Notifications
--
-- This migration adds:
-- 1. notes + tags columns to ClientProfile (for CRM feature)
-- 2. blockedDates column to CreatorProfile (for availability block-out dates)
-- 3. NotificationPreference table (for booking reminder preferences)
--
-- DocumentTemplate table already exists in the Prisma schema & Supabase.
-- Run against your Supabase SQL editor or psql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ClientProfile — add notes and tags columns for CRM
-- ---------------------------------------------------------------------------
ALTER TABLE "ClientProfile"
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "tags"  TEXT[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 2. CreatorProfile — add blockedDates column (JSONB array of date ranges)
-- ---------------------------------------------------------------------------
ALTER TABLE "CreatorProfile"
  ADD COLUMN IF NOT EXISTS "blockedDates" JSONB DEFAULT '[]';

COMMENT ON COLUMN "CreatorProfile"."blockedDates" IS
  'JSON array of { start: ISO date, end: ISO date, reason?: string } objects';

-- ---------------------------------------------------------------------------
-- 3. NotificationPreference — booking reminder preferences per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "remind7Days"   BOOLEAN NOT NULL DEFAULT true,
  "remind24Hours" BOOLEAN NOT NULL DEFAULT true,
  "remindDayOf"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NotificationPreference_userId_key" UNIQUE ("userId"),
  CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx"
  ON "NotificationPreference"("userId");

-- ---------------------------------------------------------------------------
-- Enable Row Level Security (matches existing pattern)
-- ---------------------------------------------------------------------------
ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own notification preferences
CREATE POLICY "Users can manage own notification preferences"
  ON "NotificationPreference"
  FOR ALL
  USING (true)
  WITH CHECK (true);
