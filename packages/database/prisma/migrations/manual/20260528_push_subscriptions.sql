-- Web Push subscriptions per device.
-- One user can have many devices; each device has a unique endpoint URL.
-- p256dh + auth are the Web Push encryption keys returned by
-- PushManager.subscribe() in the browser. Required to send push messages.

CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastUsedAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key"
  ON "PushSubscription" ("endpoint");

CREATE INDEX IF NOT EXISTS "PushSubscription_user_idx"
  ON "PushSubscription" ("userId");
