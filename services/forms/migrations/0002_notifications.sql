ALTER TABLE enquiries ADD COLUMN notification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN notification_claim_until TEXT;
ALTER TABLE enquiries ADD COLUMN notification_next_at TEXT;
ALTER TABLE enquiries ADD COLUMN notification_message_id TEXT;
ALTER TABLE enquiries ADD COLUMN notification_error_code TEXT;
CREATE INDEX enquiries_notifications ON enquiries(notification_state, notification_next_at, received_at);
