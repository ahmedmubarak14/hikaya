-- BlogPost table for creator journals / blog
-- Run this in the Supabase SQL Editor before running seed-content.mjs
--
-- Matches the BlogPost type from apps/web/src/lib/blog/mock-data.ts
-- and follows the conventions from the Prisma schema (cuid IDs, timestamps).

-- Create the PostStatus enum (safe if it already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
    CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');
  END IF;
END $$;

-- Create the BlogPost table
CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id"          TEXT PRIMARY KEY,
  "creatorId"   TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  "slug"        TEXT NOT NULL,
  "titleEn"     TEXT NOT NULL,
  "titleAr"     TEXT,
  "coverUrl"    TEXT,
  "bodyEn"      TEXT NOT NULL,
  "bodyAr"      TEXT,
  "tags"        TEXT[] DEFAULT '{}',
  "status"      "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_creator_slug_key" ON "BlogPost"("creatorId", "slug");
CREATE INDEX IF NOT EXISTS "BlogPost_creatorId_idx" ON "BlogPost"("creatorId");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");

-- Enable RLS (Supabase convention) — allow service_role full access, anon read-only on published
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access" ON "BlogPost"
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon read published posts" ON "BlogPost"
  FOR SELECT
  USING ("status" = 'PUBLISHED');
