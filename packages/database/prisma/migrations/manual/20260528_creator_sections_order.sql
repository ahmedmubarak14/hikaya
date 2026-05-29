-- Optional per-creator ordering of public profile sections. NULL falls back
-- to the platform default ['work', 'store', 'about']. Stored as a TEXT[]
-- so it's easy to filter+reorder in the form without a JSON parse.

ALTER TABLE "CreatorProfile"
  ADD COLUMN IF NOT EXISTS "sectionsOrder" TEXT[] DEFAULT NULL;
