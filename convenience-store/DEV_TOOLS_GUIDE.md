# 🛠️ Developer Tools Guide

คู่มือการใช้งาน Development Tools และ Cache Management

## 🎯 ฟีเจอร์ที่เพิ่มเข้ามา

### 1. 🔥 HMR Indicator (Hot Module Replacement)

แสดงสถานะการ reload แบบ real-time

**ตำแหน่ง**: มุมล่างขวาของหน้าจอ (เฉพาะ Development mode)

**การทำงาน**:

- แสดงข้อความ "Hot Reload..." พร้อม animation เมื่อมีการอัปเดต code
- หายไปอัตโนมัติหลังจาก 1 วินาที
- ไม่แสดงใน Production

**ประโยชน์**:

- รู้ทันทีว่า code อัปเดตแล้ว
- ไม่ต้องสงสัยว่า browser cache หรือไม่
- ช่วยในการ debug

---

### 2. 📌 Version Badge

แสดงเวอร์ชันของ app ที่กำลังรัน

**ตำแหน่ง**: มุมล่างขวา ใต้ HMR Indicator

**รูปแบบ**: `v2601051248 DEV`

- เลขเวอร์ชัน = Timestamp (YYMMDDHHmm)
- แสดง "DEV" ใน development mode

**วิธีใช้**:

- Hover เพื่อดูเวลาอัปเดตล่าสุด
- คลิกเพื่อ copy version number (optional)

**ประโยชน์**:

- ตรวจสอบว่า code อัปเดตจริงหรือไม่
- เปรียบเทียบเวอร์ชันระหว่าง environments
- Debug cache issues

---

### 3. 🔄 Auto Cache Clear (Service Worker)

ลบ cache เก่าอัตโนมัติเมื่อมีเวอร์ชันใหม่

**การทำงาน**:

1. Service Worker ตรวจจับเวอร์ชันใหม่
2. ลบ cache เก่าทั้งหมด
3. แจ้งเตือนผู้ใช้ให้ refresh

**ฟีเจอร์**:

- Version-based caching (`saduaksue-v2.0.0`)
- Auto cleanup old caches
- Skip caching for admin routes
- Message passing between SW and app

---

### 4. 🎉 Update Notification

แจ้งเตือนเมื่อมีเวอร์ชันใหม่พร้อมใช้งาน

**ตำแหน่ง**: ด้านล่างของหน้าจอ (เหนือ bottom nav)

**การทำงาน**:

- แสดงเมื่อ Service Worker ตรวจพบเวอร์ชันใหม่
- ปุ่ม "อัปเดตเลย" - reload และใช้เวอร์ชันใหม่
- ปุ่ม X - ปิดการแจ้งเตือน (ชั่วคราว)

**ประโยชน์**:

- ผู้ใช้ได้ใช้ฟีเจอร์ใหม่ทันที
- ลด cache issues
- UX ที่ดีกว่าการ force reload

---

## 🚀 วิธีใช้งาน

### สำหรับ Developer

#### 1. ตรวจสอบว่า HMR ทำงาน

```bash
# แก้ไขไฟล์ใดก็ได้
# ดูที่มุมล่างขวา ต้องเห็น "Hot Reload..." แว่บขึ้นมา
```

#### 2. ตรวจสอบ Version

```bash
# ดูที่ Version Badge มุมล่างขวา
# เลขเวอร์ชันต้องเปลี่ยนทุกครั้งที่ restart dev server
```

#### 3. ทดสอบ Service Worker (Production)

```bash
# Build production
npm run build

# Preview
npm run preview

# เปิด browser ไปที่ http://localhost:4173
# แก้ไข VERSION ใน public/sw.js
# Build ใหม่
# Refresh browser - ต้องเห็น Update Notification
```

#### 4. Clear Cache ด้วยตนเอง

```javascript
// ใน Browser Console
if ("serviceWorker" in navigator) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}
```

---

### สำหรับ QA/Tester

#### ตรวจสอบว่าได้เวอร์ชันล่าสุด

1. ดูที่ Version Badge มุมล่างขวา
2. เปรียบเทียบกับเวอร์ชันที่ควรจะเป็น
3. ถ้าไม่ตรง ให้ Hard Refresh (Ctrl+Shift+R)

#### ทดสอบ Update Flow

1. เปิด app เวอร์ชันเก่า
2. Deploy เวอร์ชันใหม่
3. รอ 1-2 นาที
4. ต้องเห็น Update Notification
5. คลิก "อัปเดตเลย"
6. ตรวจสอบว่าเป็นเวอร์ชันใหม่

---

## 🔧 Configuration

### เปลี่ยน Version Format

แก้ไขใน `vite.config.js`:

```javascript
// ใช้ package.json version
import pkg from "./package.json";
const version = pkg.version;

// หรือใช้ Git commit hash
import { execSync } from "child_process";
const version = execSync("git rev-parse --short HEAD").toString().trim();

// หรือใช้ timestamp (ปัจจุบัน)
const version = new Date()
  .toISOString()
  .slice(0, 19)
  .replace(/[-:T]/g, "")
  .slice(2, 12);
```

### ปิด Dev Indicator

แก้ไขใน `DevIndicator.vue`:

```vue
<template>
  <!-- เปลี่ยน v-if="isDev" เป็น v-if="false" -->
  <div v-if="false" class="...">
</template>
```

### ปรับแต่ง Cache Strategy

แก้ไขใน `public/sw.js`:

```javascript
// เปลี่ยนจาก Network First เป็น Cache First
event.respondWith(
  caches.match(request).then((cachedResponse) => {
    return cachedResponse || fetch(request);
  })
);
```

---

## 🐛 Troubleshooting

### ปัญหา: HMR Indicator ไม่แสดง

**สาเหตุ**:

- ไม่ได้อยู่ใน development mode
- Component ไม่ถูก import ใน App.vue

**แก้ไข**:

```bash
# ตรวจสอบว่ารัน dev server
npm run dev

# ตรวจสอบ import ใน App.vue
import DevIndicator from "./components/DevIndicator.vue"
```

### ปัญหา: Version ไม่เปลี่ยน

**สาเหตุ**:

- Browser cache
- Dev server ไม่ restart

**แก้ไข**:

```bash
# Restart dev server
# กด Ctrl+C แล้ว npm run dev ใหม่

# Hard refresh browser
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

### ปัญหา: Update Notification ไม่แสดง

**สาเหตุ**:

- Service Worker ไม่ได้ register
- อยู่ใน development mode (SW ไม่ทำงาน)

**แก้ไข**:

```bash
# ต้อง build และ preview
npm run build
npm run preview

# ตรวจสอบ SW registration
# เปิด DevTools > Application > Service Workers
```

### ปัญหา: Cache ไม่ clear

**สาเหตุ**:

- Service Worker ยังใช้เวอร์ชันเก่า
- Browser ไม่รองรับ SW

**แก้ไข**:

```javascript
// Clear cache ด้วยตนเอง
// ใน Browser Console
caches.keys().then((keys) => {
  Promise.all(keys.map((key) => caches.delete(key))).then(() =>
    location.reload()
  );
});
```

---

## 📊 Performance Impact

### Development Mode

- **HMR Indicator**: ~1KB (negligible)
- **Version Badge**: ~0.5KB (negligible)
- **Total Impact**: < 2KB, no performance impact

### Production Mode

- **Service Worker**: ~3KB (cached)
- **Update Notification**: ~2KB (lazy loaded)
- **Total Impact**: ~5KB, improves performance via caching

---

## 🎨 Customization

### เปลี่ยนสี HMR Indicator

```vue
<!-- DevIndicator.vue -->
<div class="bg-green-500 text-white ...">
  <!-- เปลี่ยนเป็นสีอื่น เช่น bg-blue-500, bg-purple-500 -->
</div>
```

### เปลี่ยนตำแหน่ง

```vue
<!-- DevIndicator.vue -->
<div class="fixed bottom-4 right-4 ...">
  <!-- เปลี่ยนเป็น top-4 left-4 สำหรับมุมบนซ้าย -->
</div>
```

### เพิ่ม Animation

```vue
<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
```

---

## 📚 Resources

- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)

---

**อัพเดทล่าสุด**: 2026-01-05  
**เวอร์ชัน**: 2.0.0
