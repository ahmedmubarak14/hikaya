-- Migration: Report and BlockedUser tables for content moderation.
-- Apply via the Supabase SQL editor.

-- =========================================================================
-- 1. Report table — content reporting system
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM (
      'PENDING',
      'REVIEWED',
      'DISMISSED',
      'ACTION_TAKEN'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Report" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reporterId"    TEXT NOT NULL,
  "resourceType"  TEXT NOT NULL,
  "resourceId"    TEXT NOT NULL,
  "reason"        TEXT NOT NULL,
  "description"   VARCHAR(2000),
  "status"        "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById"  TEXT,
  "reviewedAt"    TIMESTAMPTZ,
  "reviewNote"    VARCHAR(2000),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "Report_reporterId_idx"
  ON "Report"("reporterId");

CREATE INDEX IF NOT EXISTS "Report_status_idx"
  ON "Report"("status");

CREATE INDEX IF NOT EXISTS "Report_resource_idx"
  ON "Report"("resourceType", "resourceId");

COMMENT ON TABLE "Report" IS
  'Content report system. Users report profiles, jobs, blog posts, spaces, '
  'or messages. Admins review from the moderation queue and dismiss or take action.';

-- =========================================================================
-- 2. BlockedUser table — user blocking system
-- =========================================================================

CREATE TABLE IF NOT EXISTS "BlockedUser" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "blockerId"   TEXT NOT NULL,
  "blockedId"   TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "BlockedUser_unique" UNIQUE ("blockerId", "blockedId")
);

CREATE INDEX IF NOT EXISTS "BlockedUser_blockerId_idx"
  ON "BlockedUser"("blockerId");

CREATE INDEX IF NOT EXISTS "BlockedUser_blockedId_idx"
  ON "BlockedUser"("blockedId");

COMMENT ON TABLE "BlockedUser" IS
  'User block list. blockerId blocks blockedId. Blocked users are hidden '
  'from discover and cannot send messages to the blocker.';
