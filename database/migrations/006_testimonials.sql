CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  occasion_label TEXT,
  quote_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO testimonials (customer_name, occasion_label, quote_text, rating, is_published, sort_order)
SELECT 'Riya S.', 'Birthday order', 'The cake looked exactly like the reference I sent and tasted even better. Everyone asked where it was from.', 5, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE customer_name = 'Riya S.' AND occasion_label = 'Birthday order');

INSERT INTO testimonials (customer_name, occasion_label, quote_text, rating, is_published, sort_order)
SELECT 'Neha M.', 'Baby shower cake', 'The ordering process was so smooth on WhatsApp. The design felt premium, but still warm and homemade.', 5, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE customer_name = 'Neha M.' AND occasion_label = 'Baby shower cake');

INSERT INTO testimonials (customer_name, occasion_label, quote_text, rating, is_published, sort_order)
SELECT 'Arjun and Meera', 'Anniversary order', 'Beautiful finish, balanced sweetness, and on-time delivery. It made our anniversary table look special.', 5, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE customer_name = 'Arjun and Meera' AND occasion_label = 'Anniversary order');
