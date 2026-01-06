-- =============================================
-- Smart Cart Suggestions - Product Pairs
-- สินค้าที่มักซื้อคู่กัน
-- =============================================

-- Table เก็บ product pairs ที่มักซื้อด้วยกัน
CREATE TABLE IF NOT EXISTS product_pairs (
  id SERIAL PRIMARY KEY,
  product_id_a INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_id_b INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pair_count INTEGER DEFAULT 1,
  last_paired_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id_a, product_id_b),
  CHECK (product_id_a < product_id_b)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_pairs_a ON product_pairs(product_id_a);
CREATE INDEX IF NOT EXISTS idx_product_pairs_b ON product_pairs(product_id_b);
CREATE INDEX IF NOT EXISTS idx_product_pairs_count ON product_pairs(pair_count DESC);

-- Enable RLS
ALTER TABLE product_pairs ENABLE ROW LEVEL SECURITY;

-- Everyone can read product pairs (public data)
CREATE POLICY "Anyone can view product pairs" ON product_pairs
  FOR SELECT USING (true);

-- Trigger to update pairs when order status changes to delivered/completed
CREATE OR REPLACE FUNCTION trigger_update_pairs_on_complete()
RETURNS TRIGGER AS $$
DECLARE
  item_a RECORD;
  item_b RECORD;
  pair_a INTEGER;
  pair_b INTEGER;
BEGIN
  IF NEW.status IN ('delivered', 'completed') AND OLD.status NOT IN ('delivered', 'completed') THEN
    FOR item_a IN 
      SELECT product_id FROM order_items WHERE order_id = NEW.id
    LOOP
      FOR item_b IN 
        SELECT product_id FROM order_items 
        WHERE order_id = NEW.id AND product_id > item_a.product_id
      LOOP
        IF item_a.product_id < item_b.product_id THEN
          pair_a := item_a.product_id;
          pair_b := item_b.product_id;
        ELSE
          pair_a := item_b.product_id;
          pair_b := item_a.product_id;
        END IF;
        
        INSERT INTO product_pairs (product_id_a, product_id_b, pair_count, last_paired_at)
        VALUES (pair_a, pair_b, 1, NOW())
        ON CONFLICT (product_id_a, product_id_b) 
        DO UPDATE SET 
          pair_count = product_pairs.pair_count + 1,
          last_paired_at = NOW();
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_complete_update_pairs ON orders;
CREATE TRIGGER on_order_complete_update_pairs
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pairs_on_complete();

-- Function to get suggestions for cart items
CREATE OR REPLACE FUNCTION get_cart_suggestions(cart_product_ids INTEGER[], limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id INTEGER,
  suggestion_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pp.product_id_a = ANY(cart_product_ids) THEN pp.product_id_b
      ELSE pp.product_id_a
    END as pid,
    SUM(pp.pair_count)::INTEGER as score
  FROM product_pairs pp
  WHERE 
    (pp.product_id_a = ANY(cart_product_ids) OR pp.product_id_b = ANY(cart_product_ids))
    AND NOT (pp.product_id_a = ANY(cart_product_ids) AND pp.product_id_b = ANY(cart_product_ids))
  GROUP BY pid
  ORDER BY score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial product pairs (common combinations)
INSERT INTO product_pairs (product_id_a, product_id_b, pair_count) VALUES
  (6, 13, 50),
  (3, 4, 45),
  (4, 13, 40),
  (2, 9, 35),
  (1, 2, 30),
  (5, 13, 28),
  (5, 6, 25),
  (8, 9, 22),
  (3, 9, 20),
  (4, 10, 18)
ON CONFLICT (product_id_a, product_id_b) DO UPDATE SET pair_count = EXCLUDED.pair_count;
