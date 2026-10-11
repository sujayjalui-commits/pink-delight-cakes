-- Additive upgrade: preserve existing inquiries and history.
ALTER TABLE order_requests ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE order_requests ADD COLUMN submission_key TEXT;
ALTER TABLE order_requests ADD COLUMN submission_hash TEXT;
CREATE UNIQUE INDEX idx_order_requests_submission_key ON order_requests(submission_key);
