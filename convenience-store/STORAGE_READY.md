# ✅ Supabase Storage พร้อมใช้งานแล้ว!

## สิ่งที่ทำเสร็จแล้ว

1. ✅ สร้าง Storage bucket "products" บน Supabase
2. ✅ ตั้งค่า RLS policies:
   - Authenticated users สามารถอัพโหลดได้
   - Public สามารถอ่านได้
3. ✅ จำกัดขนาดไฟล์สูงสุด 5MB
4. ✅ รองรับไฟล์ JPEG, PNG, WebP
5. ✅ Migration file: `025_products_storage_bucket.sql`

## วิธีทดสอบ

### ขั้นตอนที่ 1: Hard Refresh Browser

กด **Ctrl+Shift+R** (Windows/Linux) หรือ **Cmd+Shift+R** (Mac) เพื่อล้าง cache และโหลดหน้าใหม่

### ขั้นตอนที่ 2: ไปที่หน้า Admin Products

```
http://localhost:5174/admin/products
```

### ขั้นตอนที่ 3: คลิก "เพิ่มสินค้า"

คุณจะเห็น:

- ✅ ช่องอัพโหลดรูปภาพจากอุปกรณ์ (MultiImageUpload)
- ❌ **ไม่มี** ช่อง "URL รูปภาพ" อีกต่อไป

### ขั้นตอนที่ 4: ทดสอบอัพโหลด

1. คลิกปุ่ม "เพิ่มรูป"
2. เลือกรูปภาพจากเครื่อง (JPG, PNG, หรือ WebP)
3. รอระบบอัพโหลดและ compress รูปภาพ
4. รูปจะแสดงใน grid พร้อมปุ่มลบและลากเรียงลำดับ

## หากยังมีปัญหา

### ปัญหา: ยังเห็นช่อง "URL รูปภาพ"

**แก้ไข:**

1. กด Ctrl+Shift+R เพื่อ hard refresh
2. ลองปิด browser แล้วเปิดใหม่
3. ตรวจสอบว่า dev server ยังรันอยู่ (`npm run dev`)

### ปัญหา: อัพโหลดไม่สำเร็จ

**แก้ไข:**

1. ตรวจสอบว่า login เป็น admin แล้ว
2. เช็ค Console (F12) ดู error message
3. ตรวจสอบว่า bucket "products" มีอยู่จริงใน Supabase Dashboard

### ปัญหา: RLS Policy Error

**แก้ไข:**

```sql
-- ตรวจสอบ policies ใน Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'products';
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## ตรวจสอบ Storage Bucket

เข้า Supabase Dashboard:

1. ไปที่ Storage → Buckets
2. ควรเห็น bucket ชื่อ "products"
3. คลิกเข้าไปดู policies:
   - ✅ Public can view product images (SELECT)
   - ✅ Authenticated users can upload product images (INSERT)
   - ✅ Users can update their own product images (UPDATE)
   - ✅ Users can delete their own product images (DELETE)

## ข้อมูล Bucket

- **Name:** products
- **Public:** Yes
- **File Size Limit:** 5,242,880 bytes (5MB)
- **Allowed MIME Types:** image/jpeg, image/png, image/webp
- **Created:** 2026-01-05 07:41:47 UTC

## ตัวอย่างการใช้งาน

```javascript
// อัพโหลดรูปภาพ
const { data, error } = await supabase.storage
  .from("products")
  .upload(`${Date.now()}-product.jpg`, file);

// ดึง Public URL
const {
  data: { publicUrl },
} = supabase.storage.from("products").getPublicUrl("filename.jpg");
```

## หมายเหตุ

- รูปภาพจะถูก compress อัตโนมัติก่อนอัพโหลด (max 1200x1200px, quality 85%)
- รูปแรกจะเป็นรูปหลักที่แสดงในรายการสินค้า
- สามารถลากเพื่อเรียงลำดับรูปภาพได้
- รองรับอัพโหลดหลายรูปพร้อมกัน (สูงสุด 5 รูป)
