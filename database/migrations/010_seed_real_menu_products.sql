-- Seed the real Pink Delight Cakes flavor/type menu while preserving existing order snapshots.

UPDATE products
SET availability_status = 'unavailable',
    featured = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN ('midnight-chocolate', 'vintage-rose', 'classic-vanilla-berry');

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
) VALUES
  ('fruit-flavours', 'Fruit Flavours', 'Fruit cakes', 'Soft cream cake available in pineapple, blueberry, orange, mango, litchi, or strawberry.', 500, 'Fresh fruit pick', 24, 'available', 0, NULL),
  ('red-velvet', 'Red Velvet', 'Classic cream cakes', 'Moist red velvet sponge layered with smooth cream for birthdays and simple celebrations.', 500, NULL, 24, 'available', 0, NULL),
  ('butterscotch', 'Butterscotch', 'Classic cream cakes', 'Classic butterscotch cake with creamy layers and a familiar celebration flavor.', 500, NULL, 24, 'available', 0, NULL),
  ('chocolate-white-cream', 'Chocolate White Cream', 'Classic cream cakes', 'Chocolate sponge finished with light white cream for a balanced chocolate celebration cake.', 500, NULL, 24, 'available', 0, NULL),
  ('chocolate-caramel', 'Chocolate Caramel', 'Chocolate cakes', 'Chocolate cake layered with caramel notes for a richer custom celebration base.', 525, NULL, 24, 'available', 0, NULL),
  ('rose-pistachio', 'Rose Pistachio', 'Premium cakes', 'A fragrant rose and pistachio cake for elegant birthdays, anniversaries, and gifting.', 550, 'Signature pick', 24, 'available', 1, NULL),
  ('black-forest', 'Black Forest', 'Chocolate cakes', 'Chocolate sponge with cream and black forest styling for a classic party favorite.', 550, 'Popular', 24, 'available', 0, NULL),
  ('chocolate-mousse', 'Chocolate Mousse', 'Chocolate cakes', 'Soft chocolate mousse style cake for customers who want a smooth chocolate finish.', 550, NULL, 24, 'available', 0, NULL),
  ('dutch-truffle', 'Dutch Truffle', 'Premium cakes', 'Deep chocolate truffle cake with a richer finish for premium chocolate celebrations.', 650, 'Premium', 24, 'available', 1, NULL),
  ('hazelnut-mousse', 'Hazelnut Mousse', 'Premium cakes', 'Chocolate hazelnut mousse cake with a nutty, creamy profile.', 575, NULL, 24, 'available', 0, NULL),
  ('chocolate-coffee-mousse', 'Chocolate Coffee Mousse', 'Chocolate cakes', 'Chocolate mousse cake with a coffee note for a slightly grown-up celebration flavor.', 550, NULL, 24, 'available', 0, NULL),
  ('chocolate-oreo', 'Chocolate Oreo Cake', 'Chocolate cakes', 'Chocolate cake with Oreo-inspired cream and crunchy cookie notes.', 525, NULL, 24, 'available', 0, NULL),
  ('chocolate-bonbon', 'Chocolate Bonbon Cake', 'Chocolate cakes', 'Chocolate bonbon style cake for a rich, playful chocolate celebration.', 550, NULL, 24, 'available', 0, NULL),
  ('chocolate-almond', 'Chocolate Almond Cake', 'Premium cakes', 'Chocolate cake with almond notes for a richer nutty finish.', 600, NULL, 24, 'available', 0, NULL),
  ('chocolate-truffle', 'Chocolate Truffle', 'Premium cakes', 'Dense chocolate truffle cake for customers who want an indulgent chocolate centerpiece.', 650, 'Best seller', 24, 'available', 0, NULL),
  ('tiramisu', 'Tiramisu Cake', 'Premium cakes', 'Tiramisu-inspired celebration cake with creamy coffee notes.', 525, NULL, 24, 'available', 0, NULL),
  ('white-forest', 'White Forest', 'Classic cream cakes', 'Light white forest cake with soft cream layers for birthdays and family celebrations.', 525, NULL, 24, 'available', 0, NULL),
  ('mawa', 'Mawa Cake', 'Indian fusion cakes', 'Mawa cake with a warm Indian bakery flavor for simple celebrations and gifting.', 550, NULL, 24, 'available', 0, NULL),
  ('rasmalai', 'Rasmalai Cake', 'Indian fusion cakes', 'Rasmalai-inspired cake for festive occasions and Indian fusion celebrations.', 1300, 'Festive favorite', 48, 'limited', 1, NULL)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  category = excluded.category,
  short_description = excluded.short_description,
  starting_price = excluded.starting_price,
  badge = excluded.badge,
  lead_time_hours = excluded.lead_time_hours,
  availability_status = excluded.availability_status,
  featured = excluded.featured,
  image_url = COALESCE(products.image_url, excluded.image_url),
  updated_at = CURRENT_TIMESTAMP;

DELETE FROM product_options
WHERE product_id IN (
  SELECT id
  FROM products
  WHERE slug IN (
    'fruit-flavours',
    'red-velvet',
    'butterscotch',
    'chocolate-white-cream',
    'chocolate-caramel',
    'rose-pistachio',
    'black-forest',
    'chocolate-mousse',
    'dutch-truffle',
    'hazelnut-mousse',
    'chocolate-coffee-mousse',
    'chocolate-oreo',
    'chocolate-bonbon',
    'chocolate-almond',
    'chocolate-truffle',
    'tiramisu',
    'white-forest',
    'mawa',
    'rasmalai'
  )
);

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
WITH fruit_flavors(option_label, sort_order) AS (
  VALUES
    ('Pineapple', 1),
    ('Blueberry', 2),
    ('Orange', 3),
    ('Mango', 4),
    ('Litchi', 5),
    ('Strawberry', 6)
)
SELECT products.id, 'flavor', fruit_flavors.option_label, NULL, NULL, fruit_flavors.sort_order
FROM products
CROSS JOIN fruit_flavors
WHERE products.slug = 'fruit-flavours';

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', name, NULL, NULL, 1
FROM products
WHERE slug IN (
  'red-velvet',
  'butterscotch',
  'chocolate-white-cream',
  'chocolate-caramel',
  'rose-pistachio',
  'black-forest',
  'chocolate-mousse',
  'dutch-truffle',
  'hazelnut-mousse',
  'chocolate-coffee-mousse',
  'chocolate-oreo',
  'chocolate-bonbon',
  'chocolate-almond',
  'chocolate-truffle',
  'tiramisu',
  'white-forest',
  'mawa',
  'rasmalai'
);

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
WITH size_prices(slug, option_label, price, servings, sort_order) AS (
  VALUES
    ('fruit-flavours', 'Half kg', 500, 'Serves 4 to 6', 1),
    ('red-velvet', 'Half kg', 500, 'Serves 4 to 6', 1),
    ('butterscotch', 'Half kg', 500, 'Serves 4 to 6', 1),
    ('chocolate-white-cream', 'Half kg', 500, 'Serves 4 to 6', 1),
    ('chocolate-caramel', 'Half kg', 525, 'Serves 4 to 6', 1),
    ('chocolate-oreo', 'Half kg', 525, 'Serves 4 to 6', 1),
    ('tiramisu', 'Half kg', 525, 'Serves 4 to 6', 1),
    ('white-forest', 'Half kg', 525, 'Serves 4 to 6', 1),
    ('rose-pistachio', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('black-forest', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('chocolate-mousse', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('chocolate-coffee-mousse', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('chocolate-bonbon', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('mawa', 'Half kg', 550, 'Serves 4 to 6', 1),
    ('hazelnut-mousse', 'Half kg', 575, 'Serves 4 to 6', 1),
    ('chocolate-almond', 'Half kg', 600, 'Serves 4 to 6', 1),
    ('dutch-truffle', 'Half kg', 650, 'Serves 4 to 6', 1),
    ('chocolate-truffle', 'Half kg', 650, 'Serves 4 to 6', 1),
    ('fruit-flavours', '1 kg', 850, 'Serves 8 to 10', 2),
    ('red-velvet', '1 kg', 850, 'Serves 8 to 10', 2),
    ('butterscotch', '1 kg', 850, 'Serves 8 to 10', 2),
    ('chocolate-white-cream', '1 kg', 850, 'Serves 8 to 10', 2),
    ('chocolate-caramel', '1 kg', 900, 'Serves 8 to 10', 2),
    ('chocolate-oreo', '1 kg', 900, 'Serves 8 to 10', 2),
    ('tiramisu', '1 kg', 900, 'Serves 8 to 10', 2),
    ('white-forest', '1 kg', 900, 'Serves 8 to 10', 2),
    ('black-forest', '1 kg', 925, 'Serves 8 to 10', 2),
    ('rose-pistachio', '1 kg', 950, 'Serves 8 to 10', 2),
    ('chocolate-mousse', '1 kg', 950, 'Serves 8 to 10', 2),
    ('chocolate-coffee-mousse', '1 kg', 950, 'Serves 8 to 10', 2),
    ('chocolate-bonbon', '1 kg', 950, 'Serves 8 to 10', 2),
    ('mawa', '1 kg', 950, 'Serves 8 to 10', 2),
    ('hazelnut-mousse', '1 kg', 1000, 'Serves 8 to 10', 2),
    ('chocolate-almond', '1 kg', 1100, 'Serves 8 to 10', 2),
    ('dutch-truffle', '1 kg', 1200, 'Serves 8 to 10', 2),
    ('chocolate-truffle', '1 kg', 1200, 'Serves 8 to 10', 2),
    ('rasmalai', '1 kg', 1300, 'Serves 8 to 10', 1)
)
SELECT products.id, 'size', size_prices.option_label, size_prices.price, size_prices.servings, size_prices.sort_order
FROM products
INNER JOIN size_prices ON size_prices.slug = products.slug;

INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
WITH seeded_products(slug) AS (
  VALUES
    ('fruit-flavours'),
    ('red-velvet'),
    ('butterscotch'),
    ('chocolate-white-cream'),
    ('chocolate-caramel'),
    ('rose-pistachio'),
    ('black-forest'),
    ('chocolate-mousse'),
    ('dutch-truffle'),
    ('hazelnut-mousse'),
    ('chocolate-coffee-mousse'),
    ('chocolate-oreo'),
    ('chocolate-bonbon'),
    ('chocolate-almond'),
    ('chocolate-truffle'),
    ('tiramisu'),
    ('white-forest'),
    ('mawa'),
    ('rasmalai')
),
add_ons(option_label, sort_order) AS (
  VALUES
    ('Message topper', 1),
    ('Candles', 2),
    ('Photo print', 3),
    ('Theme decoration', 4)
)
SELECT products.id, 'addon', add_ons.option_label, NULL, NULL, add_ons.sort_order
FROM products
INNER JOIN seeded_products ON seeded_products.slug = products.slug
CROSS JOIN add_ons;
