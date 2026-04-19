-- Clean up placeholder storefront business settings and starter testimonials.
-- This keeps the live site from showing generic location copy or invented reviews.

UPDATE business_settings
SET city = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(COALESCE(city, ""))) = 'your city';

UPDATE business_settings
SET delivery_pickup_copy = 'Pickup is scheduled by confirmation time, and nearby delivery can be arranged for select orders.',
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(COALESCE(delivery_pickup_copy, ""))) IN (
  '',
  'pickup and local delivery',
  'pickup and local delivery across your city',
  'pickup and local delivery across your city.',
  'available across your local area'
);

DELETE FROM testimonials
WHERE
  (customer_name = 'Riya S.' AND occasion_label = 'Birthday order' AND quote_text = 'The cake looked exactly like the reference I sent and tasted even better. Everyone asked where it was from.')
  OR
  (customer_name = 'Neha M.' AND occasion_label = 'Baby shower cake' AND quote_text = 'The ordering process was so smooth on WhatsApp. The design felt premium, but still warm and homemade.')
  OR
  (customer_name = 'Arjun and Meera' AND occasion_label = 'Anniversary order' AND quote_text = 'Beautiful finish, balanced sweetness, and on-time delivery. It made our anniversary table look special.');
