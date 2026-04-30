CREATE TABLE IF NOT EXISTS order_request_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_request_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_admin_user_id INTEGER,
  change_source TEXT NOT NULL DEFAULT 'admin_dashboard',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_request_id) REFERENCES order_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_request_status_history_order_request_id
  ON order_request_status_history(order_request_id, created_at, id);

INSERT INTO order_request_status_history (
  order_request_id,
  from_status,
  to_status,
  changed_by_admin_user_id,
  change_source,
  created_at
)
SELECT
  id,
  NULL,
  status,
  NULL,
  'migration_backfill',
  created_at
FROM order_requests
WHERE NOT EXISTS (
  SELECT 1
  FROM order_request_status_history
  WHERE order_request_status_history.order_request_id = order_requests.id
);
