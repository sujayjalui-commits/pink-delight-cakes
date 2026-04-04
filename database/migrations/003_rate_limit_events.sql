CREATE TABLE IF NOT EXISTS rate_limit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  identifier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_bucket_identifier_created_at
  ON rate_limit_events (bucket, identifier, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at
  ON rate_limit_events (created_at);
