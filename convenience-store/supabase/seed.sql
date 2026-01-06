-- =============================================
-- Seed Data - Run after schema.sql
-- =============================================

-- Categories
INSERT INTO categories (id, name, name_en, icon, sort_order) VALUES
  ('food', 'อาหาร', 'Food', 'UtensilsCrossed', 1),
  ('drinks', 'เครื่องดื่ม', 'Drinks', 'Coffee', 2),
  ('personal', 'ของใช้ส่วนตัว', 'Personal Care', 'Sparkles', 3),
  ('household', 'ของใช้ในบ้าน', 'Household', 'Home', 4),
  ('snacks', 'ขนมขบเคี้ยว', 'Snacks', 'Cookie', 5),
  ('all', 'ทั้งหมด', 'All Items', 'Grid3X3', 6)
ON CONFLICT (id) DO NOTHING;

-- Products (using placeholder images)
INSERT INTO products (name, name_en, price, original_price, image, category_id, is_flash_sale) VALUES
  ('ข้าวกล่อง หมูกระเทียม', 'Garlic Pork Rice Box', 45, 55, 'https://placehold.co/300x300/fef3c7/d97706?text=Rice+Box', 'food', true),
  ('แซนวิช ไก่อบ', 'Roasted Chicken Sandwich', 35, 42, 'https://placehold.co/300x300/fef3c7/d97706?text=Sandwich', 'food', true),
  ('น้ำดื่ม Crystal 600ml', 'Crystal Water 600ml', 7, NULL, 'https://placehold.co/300x300/dbeafe/2563eb?text=Water', 'drinks', false),
  ('กาแฟกระป๋อง เบิร์ดี้', 'Birdy Canned Coffee', 15, 18, 'https://placehold.co/300x300/dbeafe/2563eb?text=Coffee', 'drinks', true),
  ('ขนมปังปิ้ง เนยสด', 'Butter Toast', 25, NULL, 'https://placehold.co/300x300/fef3c7/d97706?text=Toast', 'food', false),
  ('โยเกิร์ต ดัชชี่', 'Dutchie Yogurt', 12, 15, 'https://placehold.co/300x300/dbeafe/2563eb?text=Yogurt', 'drinks', true),
  ('มาม่า รสต้มยำกุ้ง', 'Mama Tom Yum Shrimp', 8, NULL, 'https://placehold.co/300x300/fef3c7/d97706?text=Noodles', 'food', false),
  ('ยาสีฟัน คอลเกต', 'Colgate Toothpaste', 35, 45, 'https://placehold.co/300x300/fce7f3/db2777?text=Toothpaste', 'personal', true),
  ('สบู่ ลักส์', 'Lux Soap', 25, NULL, 'https://placehold.co/300x300/fce7f3/db2777?text=Soap', 'personal', false),
  ('ไอศกรีม วอลล์', 'Walls Ice Cream', 20, 25, 'https://placehold.co/300x300/fef3c7/d97706?text=Ice+Cream', 'food', true),
  ('ชาเขียว โออิชิ', 'Oishi Green Tea', 20, NULL, 'https://placehold.co/300x300/dbeafe/2563eb?text=Green+Tea', 'drinks', false),
  ('ขนมปัง ฟาร์มเฮ้าส์', 'Farmhouse Bread', 32, NULL, 'https://placehold.co/300x300/fef3c7/d97706?text=Bread', 'food', false),
  ('แชมพู แพนทีน', 'Pantene Shampoo', 89, 109, 'https://placehold.co/300x300/fce7f3/db2777?text=Shampoo', 'personal', true),
  ('นมสด เมจิ', 'Meiji Fresh Milk', 18, NULL, 'https://placehold.co/300x300/dbeafe/2563eb?text=Milk', 'drinks', false),
  ('ถุงขยะ ตราเสือ', 'Tiger Garbage Bags', 29, 35, 'https://placehold.co/300x300/d1fae5/059669?text=Bags', 'household', false);

-- Banners
INSERT INTO banners (image, title, subtitle, sort_order) VALUES
  ('https://placehold.co/800x400/007f3e/ffffff?text=Promotion+50%25+OFF', 'โปรโมชั่นสุดคุ้ม!', 'ลดสูงสุด 50%', 1),
  ('https://placehold.co/800x400/f27220/ffffff?text=Free+Delivery', 'สั่งครบ 200 บาท', 'ส่งฟรี!', 2),
  ('https://placehold.co/800x400/2563eb/ffffff?text=New+Member+20%25', 'สมาชิกใหม่', 'รับส่วนลด 20%', 3);

-- Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, valid_until, is_active) VALUES
  ('WELCOME20', 'ส่วนลด 20% สำหรับสมาชิกใหม่', 'percentage', 20, 100, 50, NOW() + INTERVAL '30 days', true),
  ('FREESHIP', 'ส่งฟรีไม่มีขั้นต่ำ', 'fixed', 30, 0, 30, NOW() + INTERVAL '7 days', true),
  ('SAVE50', 'ลด 50 บาท เมื่อซื้อครบ 300', 'fixed', 50, 300, 50, NOW() + INTERVAL '14 days', true)
ON CONFLICT (code) DO NOTHING;
