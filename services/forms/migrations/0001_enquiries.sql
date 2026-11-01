CREATE TABLE IF NOT EXISTS enquiries (
  request_id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  received_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  crm_synced_at TEXT,
  notified_at TEXT,
  notification_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_state IN ('pending', 'sent', 'uncertain'))
);
CREATE INDEX IF NOT EXISTS enquiries_delivery ON enquiries(crm_synced_at, notification_state, received_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
