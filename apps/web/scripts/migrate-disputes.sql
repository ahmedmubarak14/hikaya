-- Migration: Ensure the Dispute table exists in Supabase.
-- The Dispute model is already defined in the Prisma schema.
-- This SQL can be applied directly via the Supabase SQL editor
-- if the full Prisma migration hasn't been run yet.

-- Create the DisputeStatus enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
    CREATE TYPE "DisputeStatus" AS ENUM (
      'OPEN',
      'CREATOR_RESPONDED',
      'UNDER_REVIEW',
      'RESOLVED_CREATOR',
      'RESOLVED_CLIENT_PARTIAL',
      'RESOLVED_CLIENT_FULL',
      'APPEALED'
    );
  END IF;
END
$$;

-- Create the Dispute table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Dispute" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "bookingId"       TEXT NOT NULL UNIQUE REFERENCES "Booking"("id") ON DELETE CASCADE,
  "raisedByUserId"  TEXT NOT NULL,
  "reason"          TEXT NOT NULL,
  "description"     VARCHAR(4000) NOT NULL,
  "creatorResponse" VARCHAR(4000),
  "resolution"      VARCHAR(4000),
  "status"          "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "raisedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "responseDueAt"   TIMESTAMPTZ NOT NULL,
  "resolvedAt"      TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by booking
CREATE INDEX IF NOT EXISTS "Dispute_bookingId_idx"
  ON "Dispute"("bookingId");

-- Index for user's disputes
CREATE INDEX IF NOT EXISTS "Dispute_raisedByUserId_idx"
  ON "Dispute"("raisedByUserId");

-- RLS policies (if RLS is enabled on the table)
-- Allow authenticated users to read disputes they're involved in,
-- and insert disputes for their own bookings.
-- Detailed RLS is left for a follow-up since the app currently uses
-- the service role / anon key with row-level checks in server actions.

COMMENT ON TABLE "Dispute" IS
  'Dispute resolution system. Filed by either party in a booking. '
  'Creator has 48h to respond (responseDueAt). Admin transitions '
  'status through UNDER_REVIEW to a RESOLVED_* terminal state.';
