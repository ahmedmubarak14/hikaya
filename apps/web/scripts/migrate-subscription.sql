-- =============================================================================
-- Migration: Subscription table for free-tier portfolio limit checks.
--
-- Run via the Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "plan"        TEXT NOT NULL DEFAULT 'FREE',
  "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_unique" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_plan_idx" ON "Subscription"("plan");
