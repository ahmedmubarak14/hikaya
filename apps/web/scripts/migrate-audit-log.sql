-- =============================================================================
-- Migration: AuditLog table for system-wide audit trail.
--
-- Run via the Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action"      TEXT NOT NULL,
  "entityType"  TEXT,
  "entityId"    TEXT,
  "metadata"    JSONB DEFAULT '{}',
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
