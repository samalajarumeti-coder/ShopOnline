# Product Bundles & Deals Guide

## Overview

ระบบ Product Bundles ช่วยเพิ่มยอดขายโดยแนะนำสินค้าที่เข้าคู่กัน และสร้างดีลพิเศษ

## Features

### 1. Product Bundles

- **Bundle Types**:

  - Percentage Discount: ลด X%
  - Fixed Discount: ลดเงินคงที่
  - Special Price: ราคาพิเศษ

- **Bundle Configuration**:
  - ชื่อและคำอธิบาย
  - สินค้าในชุด (จำนวน, required/optional)
  - ส่วนลด
  - วันเริ่ม-สิ้นสุด

### 2. Frequently Bought Together

- วิเคราะห์จาก order history
- แสดงสินค้าที่ลูกค้ามักซื้อคู่กัน
- Confidence score

### 3. Product Associations

- Auto-update จาก orders
- Track frequency
- Calculate confidence

## Database Schema

### product_bundles

```sql
- id: UUID
- name: TEXT (ชื่อดีล)
- name_en: TEXT
- description: TEXT
- discount_type: percentage | fixed | special_price
- discount_value: DECIMAL
- min_quantity: INTEGER
- is_active: BOOLEAN
- start_date: TIMESTAMPTZ
- end_date: TIMESTAMPTZ
```

### bundle_products

```sql
- id: UUID
- bundle_id: UUID
- product_id: UUID
- quantity: INTEGER
- is_required: BOOLEAN
```

### product_associations

```sql
- id: UUID
- product_a_id: UUID
- product_b_id: UUID
- frequency: INTEGER (จำนวนครั้งที่ซื้อคู่กัน)
- confidence: DECIMAL (ความมั่นใจ 0-1)
```

## Usage

### Create Bundle (Admin)

```javascript
// Example: Buy 3 Get 10% Off
const bundle = {
  name: "ซื้อ 3 ชิ้น ลด 10%",
  description: "เลือกสินค้าในชุดนี้ 3 ชิ้น รับส่วนลด 10%",
  discount_type: "percentage",
  discount_value: 10,
  min_quantity: 3,
  is_active: true,
};

// Add products to bundle
const bundleProducts = [
  { product_id: "uuid-1", quantity: 1, is_required: true },
  { product_id: "uuid-2", quantity: 1, is_required: true },
  { product_id: "uuid-3", quantity: 1, is_required: true },
];
```

### Display Bundles (Frontend)

```vue
<template>
  <ProductBundles
    :product-id="currentProduct.id"
    :show-frequently-bought="true"
  />
</template>

<script setup>
import ProductBundles from "@/components/ProductBundles.vue";
</script>
```

### Check Bundle Eligibility

```javascript
import { useBundles } from "@/composables/useBundles";

const { checkBundleEligibility } = useBundles();

// Check if cart qualifies for bundle
const eligible = checkBundleEligibility(bundle, cartItems);
if (eligible) {
  // Show bundle discount
}
```

## Algorithm: Product Associations

### How It Works

1. **Data Collection**:

   - Trigger on order creation
   - Extract all product pairs from order
   - Update frequency count

2. **Confidence Calculation**:

   ```
   confidence = frequency(A,B) / total_orders_with_A
   ```

3. **Recommendations**:
   - Sort by frequency DESC
   - Filter by confidence > threshold
   - Limit results

### Example

```sql
-- Get top recommendations for product A
SELECT
  pb.id,
  pb.name,
  pa.frequency,
  pa.confidence
FROM product_associations pa
JOIN products pb ON pa.product_b_id = pb.id
WHERE pa.product_a_id = 'product-a-uuid'
ORDER BY pa.frequency DESC
LIMIT 4
```

## Admin Interface

### Create Bundle

1. ไปที่ Admin > Bundles
2. กด "Create Bundle"
3. กรอกข้อมูล:
   - ชื่อดีล
   - ประเภทส่วนลด
   - มูลค่าส่วนลด
   - เลือกสินค้า
4. บันทึก

### Monitor Performance

```sql
-- Bundle performance
SELECT
  b.name,
  COUNT(DISTINCT o.id) as orders_count,
  SUM(o.total) as revenue
FROM product_bundles b
JOIN orders o ON o.items @> ANY(
  SELECT jsonb_agg(bp.product_id)
  FROM bundle_products bp
  WHERE bp.bundle_id = b.id
)
GROUP BY b.id
ORDER BY revenue DESC
```

## Best Practices

### 1. Bundle Design

- **Complementary Products**: เลือกสินค้าที่เข้าคู่กัน
- **Value Perception**: ส่วนลดต้องคุ้มค่า (อย่างน้อย 10%)
- **Clear Communication**: อธิบายดีลให้ชัดเจน

### 2. Pricing Strategy

- **Percentage**: ดีสำหรับสินค้าราคาสูง
- **Fixed**: ดีสำหรับสินค้าราคาใกล้เคียงกัน
- **Special Price**: ดีสำหรับ clearance

### 3. Timing

- **Seasonal**: ดีลตามเทศกาล
- **Inventory**: ช่วยขายสินค้าคงคลัง
- **New Products**: แนะนำสินค้าใหม่

### 4. Testing

- A/B test ส่วนลดต่างๆ
- Monitor conversion rate
- Adjust based on data

## Analytics

### Key Metrics

1. **Bundle Conversion Rate**:

   ```
   (Orders with bundle / Total orders) * 100
   ```

2. **Average Order Value (AOV)**:

   ```
   Total revenue / Number of orders
   ```

3. **Bundle Attachment Rate**:
   ```
   (Orders with bundle / Orders with bundle products) * 100
   ```

### Queries

```sql
-- Top performing bundles
SELECT
  b.name,
  COUNT(*) as usage_count,
  AVG(calculate_bundle_price(b.id)) as avg_price,
  SUM(calculate_bundle_savings(b.id)) as total_savings
FROM product_bundles b
JOIN bundle_products bp ON bp.bundle_id = b.id
GROUP BY b.id
ORDER BY usage_count DESC
LIMIT 10

-- Frequently bought together insights
SELECT
  pa.name as product_a,
  pb.name as product_b,
  pa.frequency,
  pa.confidence
FROM product_associations pa
JOIN products pa ON pa.product_a_id = pa.id
JOIN products pb ON pa.product_b_id = pb.id
WHERE pa.confidence > 0.3
ORDER BY pa.frequency DESC
```

## Optimization Tips

1. **Cache Bundle Data**: ใช้ Redis หรือ in-memory cache
2. **Lazy Load**: โหลด bundles เมื่อจำเป็น
3. **Index Optimization**: สร้าง indexes ที่เหมาะสม
4. **Batch Updates**: Update associations แบบ batch

## Future Enhancements

1. **Dynamic Bundles**: สร้าง bundles อัตโนมัติจาก ML
2. **Personalized Bundles**: แนะนำตาม user behavior
3. **Time-based Bundles**: ดีลตามเวลา (Happy Hour)
4. **Tiered Discounts**: ซื้อมากลดมาก
5. **Cross-category Bundles**: รวมหลายหมวดหมู่
