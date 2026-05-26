-- Migration: Create the Review table (if not already present via Prisma)
-- The Review model exists in the Prisma schema, but this SQL can be
-- applied directly against Supabase when the full Prisma migration hasn't
-- been run yet.

-- Only create if the table doesn't exist already.
CREATE TABLE IF NOT EXISTS "Review" (
  "id"        TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "authorId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "rating"    INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "body"      VARCHAR(2000),
  "isPublic"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one review per booking per author.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Review_bookingId_authorId_key'
  ) THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_authorId_key"
      UNIQUE ("bookingId", "authorId");
  END IF;
END $$;

-- Index for looking up reviews by subject (creator).
CREATE INDEX IF NOT EXISTS "Review_subjectId_idx" ON "Review" ("subjectId");

-- Ensure CreatorProfile has the review aggregation columns.
ALTER TABLE "CreatorProfile" ADD COLUMN IF NOT EXISTS "reviewScore" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "CreatorProfile" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;

-- Enable Row Level Security (Supabase convention).
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see public reviews.
CREATE POLICY IF NOT EXISTS "reviews_public_read" ON "Review"
  FOR SELECT USING ("isPublic" = true);

-- Authenticated write: authors can insert their own reviews.
CREATE POLICY IF NOT EXISTS "reviews_author_insert" ON "Review"
  FOR INSERT WITH CHECK (auth.uid()::text = "authorId");

-- Authenticated update: authors can update their own reviews.
CREATE POLICY IF NOT EXISTS "reviews_author_update" ON "Review"
  FOR UPDATE USING (auth.uid()::text = "authorId");
