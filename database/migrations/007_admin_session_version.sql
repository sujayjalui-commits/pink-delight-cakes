ALTER TABLE admin_users
ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

UPDATE admin_users
SET session_version = 1
WHERE session_version IS NULL OR session_version < 1;
