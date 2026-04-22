-- Store no-payment inquiry bag/cart details alongside the primary order request.

ALTER TABLE order_requests ADD COLUMN cart_snapshot TEXT;
