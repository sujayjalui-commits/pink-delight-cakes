ALTER TABLE order_requests ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'not_applicable';
ALTER TABLE order_requests ADD COLUMN delivery_eta_start TEXT;
ALTER TABLE order_requests ADD COLUMN delivery_eta_end TEXT;
ALTER TABLE order_requests ADD COLUMN delivery_note TEXT;
ALTER TABLE order_requests ADD COLUMN delivery_updated_at TEXT;

UPDATE order_requests
SET delivery_status = CASE
  WHEN fulfillment_type = 'local_delivery' THEN 'delivery_pending'
  ELSE 'not_applicable'
END
WHERE delivery_status IS NULL OR delivery_status = '';
