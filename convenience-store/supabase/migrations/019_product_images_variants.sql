-- =============================================
-- Add support for multiple images and product variants
-- =============================================

-- Add images array column to products (JSONB for flexibility)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add variants support
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_options JSONB DEFAULT '{}';

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  variant_name TEXT NOT NULL,
  variant_values JSONB NOT NULL,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public read access for active variants
CREATE POLICY "product_variants_public" ON product_variants 
  FOR SELECT USING (is_active = true);

-- Admin policies for variants
CREATE POLICY "product_variants_admin_all" ON product_variants 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Comment
COMMENT ON COLUMN products.images IS 'Array of image URLs in JSONB format: ["url1", "url2", ...]';
COMMENT ON COLUMN products.variant_options IS 'Variant configuration: {"size": ["S", "M", "L"], "color": ["Red", "Blue"]}';
COMMENT ON TABLE product_variants IS 'Product variants with specific SKU, price, and stock';
