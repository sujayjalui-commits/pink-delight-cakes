ALTER TABLE business_settings ADD COLUMN featured_spotlight_title TEXT;
ALTER TABLE business_settings ADD COLUMN featured_spotlight_description TEXT;
ALTER TABLE business_settings ADD COLUMN featured_spotlight_image_url TEXT;
ALTER TABLE business_settings ADD COLUMN featured_spotlight_source_url TEXT;

UPDATE business_settings
SET featured_spotlight_title = 'Baat Pakki engagement cake',
    featured_spotlight_description = 'A customized engagement cake adorned with edible pearls and a fresh gypsy flower wreath at the base. This design is now featured on the storefront as a recent Pink Delight Cakes highlight.',
    featured_spotlight_image_url = 'src/assets/baat-pakki-engagement-cake.webp',
    featured_spotlight_source_url = 'https://www.instagram.com/p/DXQtqPNjB1L/',
    updated_at = CURRENT_TIMESTAMP
WHERE COALESCE(TRIM(featured_spotlight_title), '') = ''
  AND COALESCE(TRIM(featured_spotlight_description), '') = ''
  AND COALESCE(TRIM(featured_spotlight_image_url), '') = ''
  AND COALESCE(TRIM(featured_spotlight_source_url), '') = '';
