-- Batch 1 (Notifications & Safety): UserBlock + Report.
-- UserBlock is a directed relation (blocker → blocked). Existing pairs are
-- safe to re-insert (idempotent via unique constraint).
-- Report rolls up any abusive-content claim; the admin moderation queue
-- reads it filtered by status='OPEN'.

CREATE TABLE IF NOT EXISTS "UserBlock" (
  "id" TEXT PRIMARY KEY,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_pair_key"
  ON "UserBlock" ("blockerId", "blockedId");

CREATE INDEX IF NOT EXISTS "UserBlock_blocker_idx" ON "UserBlock" ("blockerId");

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "targetKind" TEXT NOT NULL,                          -- USER | MESSAGE | CREATOR_PROFILE | …
  "targetRef" TEXT,                                    -- optional id/slug of the target entity
  "reasonKind" TEXT NOT NULL,                          -- SPAM | HARASSMENT | INAPPROPRIATE | OTHER
  "reasonNote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',               -- OPEN | RESOLVED | DISMISSED
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolvedAt" TIMESTAMPTZ,
  "resolverId" TEXT
);

CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report" ("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Report_reporter_idx" ON "Report" ("reporterId");
