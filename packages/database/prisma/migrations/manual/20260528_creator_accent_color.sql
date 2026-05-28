-- Batch 5 (Profile customization): per-creator accent color.
-- Optional CSS hex like "#c8d32d". NULL falls back to the platform default.

ALTER TABLE "CreatorProfile" ADD COLUMN IF NOT EXISTS "accentColor" TEXT;
