-- =============================================================================
-- Hikaya — SQL migration for Digital Signature Audit Trail
--
-- This migration adds:
-- 1. signatureAuditLog JSONB column on Contract (IP + timestamp per signature)
--
-- Run against your Supabase SQL editor or psql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Contract — add signatureAuditLog column
-- ---------------------------------------------------------------------------
ALTER TABLE "Contract"
  ADD COLUMN IF NOT EXISTS "signatureAuditLog" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "Contract"."signatureAuditLog" IS
  'JSON array of audit entries: [{ side: "creator"|"client", name: string, signedAt: ISO timestamp, ip: string }]';
