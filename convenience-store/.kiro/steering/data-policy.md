---
inclusion: always
---

# Data Policy - นโยบายข้อมูล

## กฏสำคัญ: ใช้ข้อมูลจริงเท่านั้น

**ห้ามสร้าง mockup data หรือ fake data ในทุกกรณี**

### ✅ สิ่งที่ต้องทำ

- ดึงข้อมูลจาก Supabase database เสมอ
- ใช้ `supabase.from('table').select()` สำหรับทุก data fetching
- แสดง loading state ขณะรอข้อมูล
- แสดง empty state เมื่อไม่มีข้อมูลใน database

### ❌ สิ่งที่ห้ามทำ

- ห้ามสร้าง hardcoded arrays ของ products, categories, etc.
- ห้ามใช้ไฟล์ static data เช่น `data/products.js`
- ห้ามสร้าง mock API responses
- ห้าม fake delays หรือ simulated loading

### ตัวอย่างที่ถูกต้อง

```js
// ✅ ดึงจาก Supabase
const { data: products } = await supabase
  .from("products")
  .select("*")
  .eq("is_active", true);
```

### ตัวอย่างที่ผิด

```js
// ❌ ห้าม hardcode data
const products = [
  { id: 1, name: "สินค้า A", price: 100 },
  { id: 2, name: "สินค้า B", price: 200 },
];
```

### การจัดการเมื่อยังไม่มีข้อมูล

ถ้า database ยังว่าง ให้:

1. แสดง empty state ที่เป็นมิตร
2. แนะนำให้ seed ข้อมูลผ่าน Supabase Dashboard หรือ migration
3. ไม่ใช้ fallback เป็น mock data
