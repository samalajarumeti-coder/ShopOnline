-- Add sort_order and tags to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_purchase_count ON products(purchase_count DESC);

-- Function to auto-increment view count
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product analytics
CREATE OR REPLACE FUNCTION get_product_analytics()
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  low_stock_products BIGINT,
  out_of_stock_products BIGINT,
  total_views BIGINT,
  total_purchases BIGINT,
  avg_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_products,
    COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_products,
    COUNT(*) FILTER (WHERE stock > 0 AND stock <= 10)::BIGINT as low_stock_products,
    COUNT(*) FILTER (WHERE stock = 0)::BIGINT as out_of_stock_products,
    COALESCE(SUM(view_count), 0)::BIGINT as total_views,
    COALESCE(SUM(purchase_count), 0)::BIGINT as total_purchases,
    COALESCE(AVG(price), 0) as avg_price
  FROM products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  image TEXT,
  price NUMERIC,
  purchase_count INTEGER,
  stock INTEGER,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_en,
    p.image,
    p.price,
    p.purchase_count,
    p.stock,
    (p.price * p.purchase_count) as revenue
  FROM products p
  WHERE p.purchase_count > 0
  ORDER BY p.purchase_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most viewed products
CREATE OR REPLACE FUNCTION get_most_viewed_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  image TEXT,
  price NUMERIC,
  view_count INTEGER,
  purchase_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_en,
    p.image,
    p.price,
    p.view_count,
    p.purchase_count
  FROM products p
  WHERE p.view_count > 0
  ORDER BY p.view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update purchase count when order is completed
CREATE OR REPLACE FUNCTION update_product_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE products p
    SET purchase_count = purchase_count + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase count
DROP TRIGGER IF EXISTS trigger_update_purchase_count ON orders;
CREATE TRIGGER trigger_update_purchase_count
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_purchase_count();

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_product_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_viewed_products TO authenticated;
