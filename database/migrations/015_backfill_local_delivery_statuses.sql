UPDATE order_requests
SET delivery_status = 'delivery_pending'
WHERE fulfillment_type = 'local_delivery'
  AND (
    delivery_status IS NULL
    OR delivery_status = ''
    OR delivery_status = 'not_applicable'
  );
