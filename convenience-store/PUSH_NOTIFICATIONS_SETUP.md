# Push Notifications Setup Guide

## Overview

ระบบ Push Notifications ช่วยให้สามารถส่งการแจ้งเตือนแบบ real-time ไปยังผู้ใช้ได้ แม้จะไม่ได้เปิดเว็บอยู่

## Prerequisites

1. **HTTPS Required**: Push notifications ต้องใช้ HTTPS (ยกเว้น localhost)
2. **Browser Support**: รองรับ Chrome, Firefox, Edge, Safari (iOS 16.4+)
3. **VAPID Keys**: ต้องสร้าง VAPID keys สำหรับ authentication

## Setup Steps

### 1. Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Output:

```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV8-16PSNBzwGS...
Private Key: bdSiGcXmqzxB8vBBHjZdAsAO5EkPQpaEr_I...
```

### 2. Add Environment Variables

เพิ่มใน `.env`:

```env
# Push Notifications
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Request Permission

```javascript
import { usePushNotifications } from "@/composables/usePushNotifications";

const { requestPermission, isSupported } = usePushNotifications();

// Check support
if (isSupported.value) {
  // Request permission
  const granted = await requestPermission();
  if (granted) {
    console.log("Push notifications enabled!");
  }
}
```

### 4. Send Notifications (Backend)

สร้าง Supabase Edge Function หรือใช้ backend service:

```javascript
// Example using web-push library
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
const subscription = {
  endpoint: "https://...",
  keys: {
    p256dh: "...",
    auth: "...",
  },
};

const payload = JSON.stringify({
  title: "ราคาลดแล้ว!",
  body: "สินค้าที่คุณติดตามลดราคาแล้ว",
  icon: "/icon.png",
  url: "/customer/product/123",
  tag: "price-alert",
  requireInteraction: true,
});

await webpush.sendNotification(subscription, payload);
```

## Database Schema

สร้าง table สำหรับเก็บ subscriptions:

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

## Cron Job for Price Alerts

ใช้ Supabase Edge Functions หรือ Vercel Cron:

```javascript
// supabase/functions/check-price-alerts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Get triggered alerts
  const { data: alerts } = await supabase
    .from("price_alerts")
    .select(
      `
      *,
      products(*),
      profiles(*)
    `
    )
    .eq("is_active", true)
    .filter("products.price", "lte", "target_price");

  // Send notifications
  for (const alert of alerts) {
    // Get user's push subscription
    const { data: subscription } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", alert.user_id)
      .single();

    if (subscription) {
      // Send push notification
      await sendPushNotification(subscription, {
        title: "ราคาลดแล้ว! 🎉",
        body: `${alert.products.name} ลดเหลือ ฿${alert.products.price}`,
        url: `/customer/product/${alert.products.id}`,
        tag: `price-alert-${alert.id}`,
      });

      // Mark as notified
      await supabase
        .from("price_alerts")
        .update({ notified_at: new Date(), is_active: false })
        .eq("id", alert.id);
    }
  }

  return new Response("OK");
});
```

## Testing

### Test Notification

```javascript
const { sendTestNotification } = usePushNotifications();
await sendTestNotification();
```

### Debug

1. เปิด Chrome DevTools > Application > Service Workers
2. ตรวจสอบ Push subscription
3. ดู Console logs

## Best Practices

1. **Request Permission at Right Time**: ขออนุญาตเมื่อผู้ใช้ทำ action ที่เกี่ยวข้อง (เช่น ตั้ง price alert)
2. **Clear Value Proposition**: อธิบายประโยชน์ของการแจ้งเตือน
3. **Respect User Choice**: ให้ปิดการแจ้งเตือนได้ง่าย
4. **Relevant Content**: ส่งเฉพาะข้อความที่เกี่ยวข้องและมีค่า
5. **Timing**: ส่งในเวลาที่เหมาะสม (ไม่ดึกเกินไป)

## Troubleshooting

### Permission Denied

- ผู้ใช้ปฏิเสธการแจ้งเตือน → ต้องเปลี่ยนใน browser settings
- ใช้ HTTPS หรือ localhost เท่านั้น

### Subscription Failed

- ตรวจสอบ VAPID keys ถูกต้อง
- ตรวจสอบ Service Worker ลงทะเบียนสำเร็จ

### Notifications Not Showing

- ตรวจสอบ browser notification settings
- ตรวจสอบ payload format ถูกต้อง
- ดู Service Worker console logs

## Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push library](https://github.com/web-push-libs/web-push)
