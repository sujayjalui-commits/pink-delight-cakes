-- Generated from database/seeds/phase-1-seed.json

DELETE FROM payments;

DELETE FROM order_requests;

DELETE FROM product_options;

DELETE FROM products;

DELETE FROM admin_users;

DELETE FROM business_settings;

INSERT INTO business_settings (
  brand_name,
  contact_email,
  contact_phone,
  instagram_handle,
  city,
  currency,
  payment_mode,
  inquiry_channel
) VALUES (
  'Pink Delight Cakes',
  'hello@pinkdelightcakes.com',
  '+91 98765 43210',
  '@pinkdelightcakes',
  'Your City',
  'INR',
  'hybrid_razorpay',
  'website'
);

INSERT INTO admin_users (email, role, is_active)
VALUES ('admin@pinkdelightcakes.com', 'owner', 1);

INSERT INTO products (
  slug,
  name,
  category,
  short_description,
  starting_price,
  badge,
  lead_time_hours,
  availability_status,
  featured,
  image_url
) VALUES (
  'midnight-chocolate',
  'Midnight Chocolate',
  'Birthday centerpiece',
  'Rich chocolate sponge layered with smooth ganache and elegant buttercream details.',
  3200,
  'Best seller',
  24,
  'available',
  1,
  NULL
);

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Chocolate truffle', NULL, NULL, 1
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Chocolate hazelnut', NULL, NULL, 2
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Chocolate coffee', NULL, NULL, 3
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', 'Half kg', 3200, '4 to 6', 1
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '1 kg', 4200, '8 to 10', 2
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '1.5 kg', 5600, '12 to 15', 3
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Message topper', NULL, NULL, 1
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Candles', NULL, NULL, 2
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Name plaque', NULL, NULL, 3
FROM products WHERE slug = 'midnight-chocolate';

INSERT INTO products (
  slug,
  name,
  category,
  short_description,
  starting_price,
  badge,
  lead_time_hours,
  availability_status,
  featured,
  image_url
) VALUES (
  'vintage-rose',
  'Vintage Rose',
  'Anniversary and floral design',
  'Soft vanilla cake styled with romantic piped roses and a gentle pastel finish.',
  3600,
  'Pretty pick',
  48,
  'limited',
  1,
  NULL
);

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Vanilla bean', NULL, NULL, 1
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Strawberry cream', NULL, NULL, 2
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'White chocolate raspberry', NULL, NULL, 3
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', 'Half kg', 3600, '4 to 6', 1
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '1 kg', 4700, '8 to 10', 2
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '2 kg', 7600, '16 to 20', 3
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Message topper', NULL, NULL, 1
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Fresh florals', NULL, NULL, 2
FROM products WHERE slug = 'vintage-rose';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Gold acrylic name tag', NULL, NULL, 3
FROM products WHERE slug = 'vintage-rose';

INSERT INTO products (
  slug,
  name,
  category,
  short_description,
  starting_price,
  badge,
  lead_time_hours,
  availability_status,
  featured,
  image_url
) VALUES (
  'classic-vanilla-berry',
  'Classic Vanilla Berry',
  'Baby shower and minimal style',
  'Fluffy vanilla sponge with cream filling and fresh berry styling.',
  3000,
  'Light and classic',
  24,
  'available',
  0,
  NULL
);

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Classic vanilla', NULL, NULL, 1
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Vanilla berry', NULL, NULL, 2
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', 'Honey almond', NULL, NULL, 3
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', 'Half kg', 3000, '4 to 6', 1
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '1 kg', 3900, '8 to 10', 2
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', '1.5 kg', 5200, '12 to 15', 3
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Message topper', NULL, NULL, 1
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Candles', NULL, NULL, 2
FROM products WHERE slug = 'classic-vanilla-berry';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', 'Fruit garnish', NULL, NULL, 3
FROM products WHERE slug = 'classic-vanilla-berry';

