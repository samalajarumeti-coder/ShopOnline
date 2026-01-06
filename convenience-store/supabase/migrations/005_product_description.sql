-- =============================================
-- Add description column to products
-- =============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_flash_sale ON products(is_flash_sale);
