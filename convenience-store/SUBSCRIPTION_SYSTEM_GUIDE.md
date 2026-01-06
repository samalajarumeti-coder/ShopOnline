# ระบบสั่งซื้ออัตโนมัติ (Subscription System)

## ภาพรวม

ระบบ Subscription ช่วยให้ผู้ใช้สามารถตั้งค่าสั่งซื้อสินค้าที่ใช้ประจำโดยอัตโนมัติ ระบบจะสร้างคำสั่งซื้อให้ตามกำหนดเวลาที่ตั้งไว้

## ฟีเจอร์หลัก

### 1. การจัดการ Subscription

- สร้าง/แก้ไข/ลบ รายการสั่งซื้ออัตโนมัติ
- เลือกความถี่: ทุกสัปดาห์ / ทุก 2 สัปดาห์ / ทุกเดือน
- เลือกสินค้าและจำนวน
- เลือกที่อยู่จัดส่งและวิธีชำระเงิน
- ตั้งค่ายืนยันอัตโนมัติ

### 2. การแนะนำสินค้า

- แนะนำสินค้าจากหมวดหมู่เดียวกัน
- แนะนำสินค้าที่ซื้อคู่กันบ่อย
- แนะนำสินค้าลดราคา

### 3. การแจ้งเตือน

- แจ้งเตือนก่อนวันจัดส่ง 1 วัน
- แจ้งเตือนเมื่อสร้างคำสั่งซื้อสำเร็จ
- Push notification (ถ้าเปิดใช้งาน)

## การติดตั้ง

### 1. รัน Migration

```sql
-- รันใน Supabase SQL Editor ตามลำดับ
-- 1. 028_subscriptions.sql
-- 2. 029_subscription_notifications.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy process-subscriptions function
supabase functions deploy process-subscriptions

# Deploy subscription-reminders function
supabase functions deploy subscription-reminders
```

### 3. ตั้งค่า Cron Jobs

เปิด Supabase Dashboard > SQL Editor และรันคำสั่ง:

```sql
-- เปิดใช้งาน pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ตั้งค่า process subscriptions ทุกวัน 6:00 น.
SELECT cron.schedule(
  'process-subscriptions-daily',
  '0 23 * * *',  -- 6:00 AM Thailand time (UTC+7)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-subscriptions',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);

-- ตั้งค่า reminders ทุกวัน 17:00 น.
SELECT cron.schedule(
  'subscription-reminders-daily',
  '0 10 * * *',  -- 5:00 PM Thailand time
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/subscription-reminders',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### 4. ตั้งค่า Environment Variables

เพิ่มใน Supabase Dashboard > Settings > Edge Functions:

```
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## การใช้งาน

### สำหรับผู้ใช้

1. ไปที่ **โปรไฟล์** > **สั่งซื้ออัตโนมัติ**
2. กด **สร้างรายการใหม่**
3. เลือกสินค้าที่ต้องการ
4. ตั้งค่าความถี่และที่อยู่จัดส่ง
5. กด **สร้างรายการ**

### การจัดการ

- **สั่งเลย**: สร้างคำสั่งซื้อทันที
- **ข้าม**: ข้ามการจัดส่งครั้งถัดไป
- **หยุดชั่วคราว**: หยุดการสั่งซื้ออัตโนมัติ
- **แก้ไข**: เปลี่ยนแปลงรายการสินค้า

## โครงสร้างข้อมูล

### Tables

```
subscriptions
├── id (UUID)
├── user_id (UUID)
├── name (VARCHAR)
├── frequency (weekly/biweekly/monthly)
├── next_delivery_date (DATE)
├── address_id (UUID)
├── payment_method (VARCHAR)
├── auto_confirm (BOOLEAN)
├── is_active (BOOLEAN)
└── notes (TEXT)

subscription_items
├── id (UUID)
├── subscription_id (UUID)
├── product_id (UUID)
└── quantity (INTEGER)

subscription_orders
├── id (UUID)
├── subscription_id (UUID)
├── order_id (UUID)
├── scheduled_date (DATE)
├── status (pending/created/skipped/failed)
└── error_message (TEXT)

notifications
├── id (UUID)
├── user_id (UUID)
├── title (VARCHAR)
├── message (TEXT)
├── type (VARCHAR)
├── data (JSONB)
├── is_read (BOOLEAN)
└── created_at (TIMESTAMPTZ)
```

## Edge Functions

### process-subscriptions

ทำงานทุกวันเพื่อ:

1. ค้นหา subscriptions ที่ถึงกำหนดจัดส่ง
2. ตรวจสอบสินค้าและ stock
3. สร้างคำสั่งซื้อ
4. อัปเดตวันจัดส่งครั้งถัดไป
5. สร้าง notification แจ้งผู้ใช้

### subscription-reminders

ทำงานทุกวันเพื่อ:

1. ค้นหา subscriptions ที่จะจัดส่งพรุ่งนี้
2. สร้าง in-app notification
3. ส่ง push notification (ถ้าเปิดใช้งาน)

## การทดสอบ

### ทดสอบ Edge Function

```bash
# ทดสอบ process-subscriptions
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-subscriptions \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# ทดสอบ subscription-reminders
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/subscription-reminders \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### ทดสอบในแอป

1. สร้าง subscription ใหม่
2. ตั้งวันจัดส่งเป็นวันนี้
3. เรียก process-subscriptions function
4. ตรวจสอบว่ามีคำสั่งซื้อใหม่

## Troubleshooting

### Subscription ไม่ถูก process

1. ตรวจสอบว่า `is_active = true`
2. ตรวจสอบว่า `next_delivery_date <= today`
3. ตรวจสอบว่ามี items ใน subscription
4. ตรวจสอบว่ามี address_id

### Push notification ไม่ส่ง

1. ตรวจสอบ VAPID keys
2. ตรวจสอบว่าผู้ใช้มี push_subscription ใน profiles
3. ตรวจสอบ browser permissions

### Cron job ไม่ทำงาน

1. ตรวจสอบว่า pg_cron extension เปิดใช้งาน
2. ตรวจสอบ URL และ Authorization header
3. ดู logs ใน `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
