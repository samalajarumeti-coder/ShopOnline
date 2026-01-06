# 🗂️ Supabase Storage Setup Guide

คู่มือการตั้งค่า Supabase Storage สำหรับระบบอัปโหลดรูปภาพสินค้า (รองรับ Multiple Images)

## 📋 ขั้นตอนการตั้งค่า

### 1. สร้าง Storage Bucket

1. เข้าสู่ Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่เมนู **Storage** ทางด้านซ้าย
4. คลิก **"New bucket"**
5. กรอกข้อมูล:
   - **Name**: `products`
   - **Public bucket**: ✅ เปิด (เพื่อให้เข้าถึงรูปได้โดยไม่ต้อง authentication)
   - **File size limit**: `5 MB` (หรือตามต้องการ)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
6. คลิก **"Create bucket"**

### 2. รัน Database Migration

รัน migration ใหม่สำหรับ Multiple Images และ Variants:

```sql
-- ใน Supabase SQL Editor
-- รันไฟล์ supabase/migrations/019_product_images_variants.sql

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
```

### 3. ตั้งค่า Storage Policies (RLS)

ไปที่ **Storage > Policies** และสร้าง policies ดังนี้:

#### Policy 1: Public Read Access

```sql
-- ให้ทุกคนอ่านรูปได้
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');
```

#### Policy 2: Authenticated Upload

```sql
-- ให้ผู้ใช้ที่ login แล้วอัปโหลดได้
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Admin Delete

```sql
-- ให้เฉพาะ Admin ลบรูปได้
CREATE POLICY "Admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### 4. ตั้งค่า CORS (ถ้าจำเป็น)

ถ้าคุณ deploy บน domain อื่น ให้ตั้งค่า CORS:

1. ไปที่ **Settings > API**
2. เลื่อนลงไปที่ **CORS Configuration**
3. เพิ่ม domain ของคุณ เช่น:
   - `http://localhost:5173` (สำหรับ development)
   - `https://yourdomain.com` (สำหรับ production)

## 🧪 ทดสอบการอัปโหลด

### ทดสอบ Multiple Images Upload

1. Login เข้าระบบ Admin: `http://localhost:5173/admin/login`
2. ไปที่ **จัดการสินค้า**
3. คลิก **"เพิ่มสินค้า"**
4. ในส่วน **รูปภาพสินค้า** คุณจะเห็น:
   - Grid สำหรับแสดงรูปหลายรูป (สูงสุด 5 รูป)
   - ปุ่ม "เพิ่มรูป" สำหรับอัปโหลด
5. คลิก **"เพิ่มรูป"** และเลือกรูปภาพ (สามารถเลือกหลายรูปพร้อมกัน)
6. รอจนกว่าจะอัปโหลดเสร็จ
7. ลากรูปเพื่อเรียงลำดับ (รูปแรกจะเป็นรูปหลัก)
8. บันทึกสินค้า

### ทดสอบผ่าน Admin Panel (เดิม)

1. Login เข้าระบบ Admin: `http://localhost:5173/admin/login`
2. ไปที่ **จัดการสินค้า**
3. คลิก **"เพิ่มสินค้า"**
4. ในส่วน **รูปภาพสินค้า** ให้คลิก **"คลิกเพื่ออัปโหลดรูปภาพ"**
5. เลือกรูปภาพ (JPG, PNG, หรือ WebP ขนาดไม่เกิน 5MB)
6. รอจนกว่าจะอัปโหลดเสร็จ (จะเห็นข้อความ "อัปโหลดสำเร็จ")
7. บันทึกสินค้า

### ทดสอบผ่าน Supabase Dashboard

```javascript
// ทดสอบใน Browser Console
const { data, error } = await supabase.storage
  .from("products")
  .upload("test.jpg", file);

if (error) console.error("Error:", error);
else console.log("Success:", data);
```

## 📊 ตรวจสอบ Storage Usage

1. ไปที่ **Storage > products**
2. คุณจะเห็นรายการไฟล์ที่อัปโหลด
3. ตรวจสอบ Storage usage ที่มุมบนขวา

## 🔧 Troubleshooting

### ปัญหา: อัปโหลดไม่สำเร็จ (403 Forbidden)

**สาเหตุ**: Policy ไม่ถูกต้อง

**แก้ไข**:

1. ตรวจสอบว่าสร้าง Policy "Authenticated users can upload" แล้ว
2. ตรวจสอบว่า user login แล้ว (มี auth token)
3. ลอง refresh page และ login ใหม่

### ปัญหา: รูปแสดงไม่ออก (404 Not Found)

**สาเหตุ**: Bucket ไม่ได้ตั้งเป็น Public

**แก้ไข**:

1. ไปที่ **Storage > products**
2. คลิก **Settings** (ไอคอนเฟือง)
3. เปิด **"Public bucket"**
4. Save

### ปัญหา: ไฟล์ใหญ่เกินไป

**สาเหตุ**: ไฟล์เกิน 5MB

**แก้ไข**:

- ระบบจะ compress รูปอัตโนมัติเป็น 1200x1200px และ quality 85%
- ถ้ายังใหญ่อยู่ ให้ลด quality ใน `ImageUpload.vue` (บรรทัด 95)

### ปัญหา: CORS Error

**สาเหตุ**: Domain ไม่ได้รับอนุญาต

**แก้ไข**:

1. ไปที่ **Settings > API > CORS Configuration**
2. เพิ่ม domain ของคุณ
3. Save และ refresh page

## 📝 หมายเหตุ

- **Free Plan**: Supabase Free Plan ให้ Storage 1GB
- **Bandwidth**: 2GB/month สำหรับ Free Plan
- **File Naming**: ระบบจะสร้างชื่อไฟล์อัตโนมัติเป็น `timestamp-random.ext`
- **Image Optimization**: รูปจะถูก compress เป็น JPEG quality 85% อัตโนมัติ
- **Max Dimensions**: 1200x1200px (จะ resize อัตโนมัติถ้าใหญ่กว่า)
- **Multiple Images**: รองรับอัปโหลดสูงสุด 5 รูปต่อสินค้า
- **Image Array**: เก็บใน JSONB column `images` เป็น array ของ URLs
- **Drag & Drop**: รองรับการลากเรียงลำดับรูปภาพ

## 🎨 ฟีเจอร์ใหม่

### 1. Multiple Images Gallery

- อัปโหลดได้สูงสุด 5 รูปต่อสินค้า
- ลากเพื่อเรียงลำดับ
- รูปแรกเป็นรูปหลัก
- แสดง badge "หลัก" บนรูปแรก

### 2. Rich Text Editor

- รองรับ Bold, Italic
- Bullet List, Numbered List
- Headings (H3, H4, H5)
- Undo/Redo

### 3. Product Variants

- สร้างตัวเลือกสินค้า (ขนาด, สี, ฯลฯ)
- แต่ละ variant มี SKU, ราคา, สต็อกแยกกัน
- สร้าง combinations อัตโนมัติ

### 4. CSV Import/Export

- Export สินค้าทั้งหมดเป็น CSV
- Import สินค้าจำนวนมากพร้อมกัน
- ดาวน์โหลด Template ได้

## 🚀 Next Steps

หลังจากตั้งค่า Storage เสร็จแล้ว คุณสามารถ:

1. ✅ อัปโหลดรูปสินค้าหลายรูปผ่าน Admin Panel
2. ✅ ใช้ Rich Text Editor เขียนรายละเอียดสินค้า
3. ✅ สร้าง Product Variants (ขนาด, สี)
4. ✅ Import/Export สินค้าด้วย CSV
5. ✅ ลากเรียงลำดับรูปภาพ
6. ✅ ดู Preview สินค้าก่อนบันทึก

## 📚 เอกสารเพิ่มเติม

- [ADMIN_PRODUCTS_GUIDE.md](./ADMIN_PRODUCTS_GUIDE.md) - คู่มือการใช้งานฟีเจอร์ใหม่ทั้งหมด
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

---

**อัพเดทล่าสุด:** 2026-01-05  
**เวอร์ชัน:** 2.0 (with Multiple Images, Rich Text, Variants, CSV)
