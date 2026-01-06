-- Product Bundles/Deals Table
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'special_price')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundle Products (many-to-many relationship)
CREATE TABLE IF NOT EXISTS bundle_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bundle_id, product_id)
);

-- Frequently Bought Together (for recommendations)
CREATE TABLE IF NOT EXISTS product_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_a_id, product_b_id)
);

-- Indexes
CREATE INDEX idx_bundles_active ON product_bundles(is_active) WHERE is_active = true;
CREATE INDEX idx_bundles_dates ON product_bundles(start_date, end_date);
CREATE INDEX idx_bundle_products_bundle ON bundle_products(bundle_id);
CREATE INDEX idx_bundle_products_product ON bundle_products(product_id);
CREATE INDEX idx_associations_product_a ON product_associations(product_a_id);
CREATE INDEX idx_associations_product_b ON product_associations(product_b_id);
CREATE INDEX idx_associations_frequency ON product_associations(frequency DESC);

-- RLS Policies
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_associations ENABLE ROW LEVEL SECURITY;

-- Everyone can view active bundles
CREATE POLICY "Anyone can view active bundles"
  ON product_bundles FOR SELECT
  USING (is_active = true);

-- Everyone can view bundle products
CREATE POLICY "Anyone can view bundle products"
  ON bundle_products FOR SELECT
  USING (true);

-- Everyone can view product associations
CREATE POLICY "Anyone can view product associations"
  ON product_associations FOR SELECT
  USING (true);

-- Admin policies
CREATE POLICY "Admins can manage bundles"
  ON product_bundles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage bundle products"
  ON bundle_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to calculate bundle price
CREATE OR REPLACE FUNCTION calculate_bundle_price(bundle_id_param UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  total_price DECIMAL(10, 2);
  bundle_discount_type TEXT;
  bundle_discount_value DECIMAL(10, 2);
  final_price DECIMAL(10, 2);
BEGIN
  -- Get total price of all products in bundle
  SELECT COALESCE(SUM(p.price * bp.quantity), 0)
  INTO total_price
  FROM bundle_products bp
  JOIN products p ON bp.product_id = p.id
  WHERE bp.bundle_id = bundle_id_param;

  -- Get bundle discount info
  SELECT discount_type, discount_value
  INTO bundle_discount_type, bundle_discount_value
  FROM product_bundles
  WHERE id = bundle_id_param;

  -- Calculate final price based on discount type
  IF bundle_discount_type = 'percentage' THEN
    final_price := total_price * (1 - bundle_discount_value / 100);
  ELSIF bundle_discount_type = 'fixed' THEN
    final_price := total_price - bundle_discount_value;
  ELSIF bundle_discount_type = 'special_price' THEN
    final_price := bundle_discount_value;
  ELSE
    final_price := total_price;
  END IF;

  -- Ensure price is not negative
  IF final_price < 0 THEN
    final_price := 0;
  END IF;

  RETURN final_price;
END;
$$;

-- Function to update product associations based on orders
CREATE OR REPLACE FUNCTION update_product_associations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_items JSONB;
  item_a JSONB;
  item_b JSONB;
BEGIN
  -- Get order items
  order_items := NEW.items;

  -- Loop through all pairs of products in the order
  FOR item_a IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    FOR item_b IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
      -- Skip if same product
      IF (item_a->>'id')::UUID != (item_b->>'id')::UUID THEN
        -- Insert or update association
        INSERT INTO product_associations (product_a_id, product_b_id, frequency)
        VALUES (
          (item_a->>'id')::UUID,
          (item_b->>'id')::UUID,
          1
        )
        ON CONFLICT (product_a_id, product_b_id)
        DO UPDATE SET
          frequency = product_associations.frequency + 1,
          updated_at = NOW();
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to update associations when order is created
CREATE TRIGGER update_associations_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION update_product_associations();

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bundles_updated_at
  BEFORE UPDATE ON product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_bundles_updated_at();

CREATE TRIGGER associations_updated_at
  BEFORE UPDATE ON product_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_bundles_updated_at();
