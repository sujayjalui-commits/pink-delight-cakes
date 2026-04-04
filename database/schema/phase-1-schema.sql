-- Phase 1 schema for Pink Delight Cakes

CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  instagram_handle TEXT,
  city TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_mode TEXT NOT NULL DEFAULT 'hybrid_razorpay',
  inquiry_channel TEXT NOT NULL DEFAULT 'website',
  delivery_pickup_copy TEXT,
  notice_period_copy TEXT,
  bakery_intro_title TEXT,
  bakery_intro_paragraph_1 TEXT,
  bakery_intro_paragraph_2 TEXT,
  response_time_copy TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  state_region TEXT,
  postal_code TEXT,
  country_code TEXT,
  weekday_open_time TEXT,
  weekday_close_time TEXT,
  saturday_open_time TEXT,
  saturday_close_time TEXT,
  sunday_open_time TEXT,
  sunday_close_time TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL,
  starting_price INTEGER NOT NULL,
  badge TEXT,
  lead_time_hours INTEGER NOT NULL,
  availability_status TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  option_group TEXT NOT NULL,
  option_label TEXT NOT NULL,
  price INTEGER,
  servings TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  product_id INTEGER,
  product_snapshot TEXT NOT NULL,
  flavor TEXT,
  size_label TEXT,
  servings TEXT,
  event_date TEXT,
  fulfillment_type TEXT NOT NULL,
  add_on TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source_channel TEXT NOT NULL DEFAULT 'website',
  quoted_amount INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_request_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  webhook_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_request_id) REFERENCES order_requests(id) ON DELETE CASCADE
);
