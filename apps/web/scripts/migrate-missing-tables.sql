-- =============================================================================
-- Migration: Space + SpaceBooking tables for the studio-space-rental feature.
--
-- These tables are NOT in the Prisma schema (added post-schema freeze).
-- Run via the Supabase SQL Editor before seeding spaces data.
-- =============================================================================

-- Reuse existing enums from Prisma where possible; create new ones only for
-- types that don't already exist.

-- SpaceStatus enum
DO $$ BEGIN
  CREATE TYPE "SpaceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SpaceBookingStatus enum
DO $$ BEGIN
  CREATE TYPE "SpaceBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- BookingDurationKind enum
DO $$ BEGIN
  CREATE TYPE "BookingDurationKind" AS ENUM ('HOURLY', 'DAILY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Space table
CREATE TABLE IF NOT EXISTS "Space" (
  "id"                TEXT PRIMARY KEY,
  "ownerId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name"              TEXT NOT NULL,
  "description"       TEXT NOT NULL,
  "address"           TEXT NOT NULL,
  "city"              "City" NOT NULL,
  "capacity"          INTEGER NOT NULL DEFAULT 1,
  "hourlyHalalas"     INTEGER NOT NULL DEFAULT 0,
  "dailyHalalas"      INTEGER NOT NULL DEFAULT 0,
  "equipmentIncluded" TEXT[] DEFAULT '{}',
  "photos"            TEXT[] DEFAULT '{}',
  "status"            "SpaceStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Space_ownerId_idx" ON "Space"("ownerId");
CREATE INDEX IF NOT EXISTS "Space_city_idx" ON "Space"("city");
CREATE INDEX IF NOT EXISTS "Space_status_idx" ON "Space"("status");

-- SpaceBooking table
CREATE TABLE IF NOT EXISTS "SpaceBooking" (
  "id"             TEXT PRIMARY KEY,
  "spaceId"        TEXT NOT NULL REFERENCES "Space"("id") ON DELETE CASCADE,
  "renterId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "startISO"       TIMESTAMPTZ NOT NULL,
  "endISO"         TIMESTAMPTZ NOT NULL,
  "durationKind"   "BookingDurationKind" NOT NULL DEFAULT 'HOURLY',
  "totalHalalas"   INTEGER NOT NULL DEFAULT 0,
  "status"         "SpaceBookingStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SpaceBooking_spaceId_idx" ON "SpaceBooking"("spaceId");
CREATE INDEX IF NOT EXISTS "SpaceBooking_renterId_idx" ON "SpaceBooking"("renterId");
CREATE INDEX IF NOT EXISTS "SpaceBooking_status_idx" ON "SpaceBooking"("status");
