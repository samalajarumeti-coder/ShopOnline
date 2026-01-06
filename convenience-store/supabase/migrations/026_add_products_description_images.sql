-- Add description and images columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN products.description IS 'Product description in Thai';
COMMENT ON COLUMN products.images IS 'Array of product image URLs';
