-- Batch 4 (Store monetization): per-OrderItem download limits.
-- Each purchase gets a maxDownloads cap (default 5) and a downloadCount that
-- the signed-URL endpoint increments. When count >= max OR downloadExpiresAt
-- has passed, the link returns 410 GONE.

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "maxDownloads" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "downloadCount" INTEGER NOT NULL DEFAULT 0;
