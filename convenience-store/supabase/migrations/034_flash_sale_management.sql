-- Flash Sale Management
-- Add flash_sale_order column to products for ordering
ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_order INTEGER;

-- Create app_settings table for storing app configurations
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage settings
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow public read for non-sensitive settings
CREATE POLICY "Public can read app_settings" ON app_settings
  FOR SELECT USING (true);

-- Insert default flash sale settings
INSERT INTO app_settings (key, value)
VALUES ('flash_sale', '{"is_active": true, "end_time": null}')
ON CONFLICT (key) DO NOTHING;

-- Create index for flash sale products
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON products (is_flash_sale, flash_sale_order)
WHERE is_flash_sale = true;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- =====================================================
-- Scheduled Flash Sales Table
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_flash_sales (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  product_ids INTEGER[] DEFAULT '{}',
  notify_before INTEGER DEFAULT 60, -- minutes before start to notify
  is_active BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_flash_sales ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage scheduled flash sales
CREATE POLICY "Admins can manage scheduled_flash_sales" ON scheduled_flash_sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow public read for active scheduled sales
CREATE POLICY "Public can read active scheduled_flash_sales" ON scheduled_flash_sales
  FOR SELECT USING (is_active = true);

-- Index for finding upcoming sales
CREATE INDEX IF NOT EXISTS idx_scheduled_flash_sales_time 
ON scheduled_flash_sales (start_time, end_time) 
WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER scheduled_flash_sales_updated_at
  BEFORE UPDATE ON scheduled_flash_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- =====================================================
-- Function to activate scheduled flash sales
-- =====================================================
CREATE OR REPLACE FUNCTION activate_scheduled_flash_sales()
RETURNS void AS $$
DECLARE
  sale RECORD;
BEGIN
  -- Find sales that should be active now
  FOR sale IN 
    SELECT * FROM scheduled_flash_sales 
    WHERE is_active = true 
    AND start_time <= NOW() 
    AND end_time > NOW()
  LOOP
    -- Activate products for this sale
    UPDATE products 
    SET is_flash_sale = true, 
        flash_sale_order = array_position(sale.product_ids, id),
        updated_at = NOW()
    WHERE id = ANY(sale.product_ids);
  END LOOP;
  
  -- Deactivate products from ended sales
  FOR sale IN 
    SELECT * FROM scheduled_flash_sales 
    WHERE is_active = true 
    AND end_time <= NOW()
  LOOP
    UPDATE products 
    SET is_flash_sale = false, 
        flash_sale_order = NULL,
        updated_at = NOW()
    WHERE id = ANY(sale.product_ids);
    
    -- Mark sale as inactive
    UPDATE scheduled_flash_sales 
    SET is_active = false 
    WHERE id = sale.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- Flash Sale Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_ids INTEGER[] DEFAULT '{}',
  default_duration INTEGER DEFAULT 24, -- hours
  default_notify_before INTEGER DEFAULT 60, -- minutes
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE flash_sale_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage templates
CREATE POLICY "Admins can manage flash_sale_templates" ON flash_sale_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER flash_sale_templates_updated_at
  BEFORE UPDATE ON flash_sale_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- =====================================================
-- Flash Sale History Table (for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_history (
  id SERIAL PRIMARY KEY,
  scheduled_sale_id INTEGER REFERENCES scheduled_flash_sales(id),
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  product_ids INTEGER[] DEFAULT '{}',
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_items_sold INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE flash_sale_history ENABLE ROW LEVEL SECURITY;

-- Allow admins to read history
CREATE POLICY "Admins can read flash_sale_history" ON flash_sale_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- Function to record flash sale results
-- =====================================================
CREATE OR REPLACE FUNCTION record_flash_sale_results(sale_id INTEGER)
RETURNS void AS $$
DECLARE
  sale RECORD;
  stats RECORD;
BEGIN
  -- Get sale details
  SELECT * INTO sale FROM scheduled_flash_sales WHERE id = sale_id;
  
  IF sale IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate stats from orders during the flash sale period
  SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as total_items,
    COUNT(DISTINCT o.user_id) as unique_customers
  INTO stats
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.created_at BETWEEN sale.start_time AND sale.end_time
  AND oi.product_id = ANY(sale.product_ids)
  AND o.status != 'cancelled';
  
  -- Insert into history
  INSERT INTO flash_sale_history (
    scheduled_sale_id, name, start_time, end_time, product_ids,
    total_orders, total_revenue, total_items_sold, unique_customers
  ) VALUES (
    sale.id, sale.name, sale.start_time, sale.end_time, sale.product_ids,
    stats.total_orders, stats.total_revenue, stats.total_items, stats.unique_customers
  );
END;
$$ LANGUAGE plpgsql;
