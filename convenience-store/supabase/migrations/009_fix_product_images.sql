-- =============================================
-- Fix broken product images
-- Replace with working placeholder images
-- =============================================

-- Update products with broken images to use working placeholders
UPDATE products SET image = 'https://placehold.co/300x300/e2e8f0/64748b?text=Product' 
WHERE image LIKE '%photo-1610141256829%';

-- Alternative: Update all products to use consistent placeholder images
-- Uncomment below if you want to replace all images

-- UPDATE products SET image = CASE category_id
--   WHEN 'food' THEN 'https://placehold.co/300x300/fef3c7/d97706?text=Food'
--   WHEN 'drinks' THEN 'https://placehold.co/300x300/dbeafe/2563eb?text=Drinks'
--   WHEN 'personal' THEN 'https://placehold.co/300x300/fce7f3/db2777?text=Personal'
--   WHEN 'household' THEN 'https://placehold.co/300x300/d1fae5/059669?text=Household'
--   WHEN 'snacks' THEN 'https://placehold.co/300x300/fed7aa/ea580c?text=Snacks'
--   ELSE 'https://placehold.co/300x300/e2e8f0/64748b?text=Product'
-- END;
