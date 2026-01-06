# Netlify Deployment Guide

## 🚀 Quick Deploy

### Option 1: Deploy via Netlify UI (แนะนำ)

1. **Push โค้ดขึ้น Git**

   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push
   ```

2. **เข้า Netlify Dashboard**

   - ไปที่ https://app.netlify.com
   - คลิก "Add new site" → "Import an existing project"
   - เลือก Git provider (GitHub/GitLab/Bitbucket)
   - เลือก repository `convenience-store`

3. **Build Settings** (ควรตั้งค่าอัตโนมัติจาก netlify.toml)

   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`

4. **Environment Variables**
   ไปที่ Site settings → Environment variables → Add variables:

   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Deploy!**
   - คลิก "Deploy site"
   - รอ 2-3 นาที
   - เสร็จแล้ว! 🎉

### Option 2: Deploy via Netlify CLI

1. **ติดตั้ง Netlify CLI**

   ```bash
   npm install -g netlify-cli
   ```

2. **Login**

   ```bash
   netlify login
   ```

3. **Initialize Site**

   ```bash
   cd convenience-store
   netlify init
   ```

   - เลือก "Create & configure a new site"
   - เลือก team
   - ตั้งชื่อ site (หรือปล่อยว่างให้สุ่ม)

4. **ตั้งค่า Environment Variables**

   ```bash
   netlify env:set VITE_SUPABASE_URL "your-supabase-url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
   ```

5. **Deploy**

   ```bash
   # Deploy แบบ draft (ทดสอบก่อน)
   netlify deploy

   # Deploy production
   netlify deploy --prod
   ```

## 🔧 Configuration Details

### netlify.toml

ไฟล์นี้กำหนดการตั้งค่า build และ deployment:

- ✅ SPA routing redirects
- ✅ Security headers
- ✅ Asset caching
- ✅ Service Worker configuration

### Auto Deploy

Netlify จะ auto deploy ทุกครั้งที่:

- Push ไป main/master branch → Production
- Push ไป branch อื่น → Preview deployment

## 🌐 Custom Domain (ถ้าต้องการ)

1. ไปที่ Site settings → Domain management
2. คลิก "Add custom domain"
3. ใส่ domain ของคุณ (เช่น mystore.com)
4. ตั้งค่า DNS ตามที่ Netlify บอก

## 📊 Features ที่ได้ฟรี

- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Continuous deployment
- ✅ Deploy previews
- ✅ Rollback ได้ทันที
- ✅ 100GB bandwidth/เดือน
- ✅ Form handling
- ✅ Serverless functions (ถ้าต้องการ)

## 🔍 Monitoring

### View Logs

```bash
netlify logs
```

### Open Site

```bash
netlify open:site
```

### Open Admin

```bash
netlify open:admin
```

## 🐛 Troubleshooting

### Build Failed?

1. ตรวจสอบ environment variables ครบหรือไม่
2. ลอง build local: `npm run build`
3. ดู build logs ใน Netlify dashboard

### 404 Errors?

- ตรวจสอบว่ามี redirect rule ใน netlify.toml
- ควรมี `[[redirects]]` สำหรับ SPA routing

### Environment Variables ไม่ทำงาน?

- ต้องขึ้นต้นด้วย `VITE_` เท่านั้น
- Redeploy หลังเพิ่ม env vars

## 📱 Test Your Deployment

หลัง deploy เสร็จ ทดสอบ:

- [ ] หน้าแรกโหลดได้
- [ ] Login/Register ทำงาน
- [ ] เพิ่มสินค้าลงตะกร้าได้
- [ ] Routing ทำงานถูกต้อง (ไม่ 404)
- [ ] Service Worker ทำงาน (offline support)
- [ ] Images โหลดจาก Supabase Storage

## 🎯 Next Steps

1. ตั้งค่า custom domain (ถ้าต้องการ)
2. Enable deploy notifications (Slack/Email)
3. ตั้งค่า branch deploys สำหรับ staging
4. Monitor analytics ใน Netlify dashboard

## 💡 Tips

- ใช้ `netlify dev` เพื่อ test locally with Netlify environment
- Deploy previews ดีมากสำหรับ review code
- Rollback ได้ทันทีถ้ามีปัญหา (ใน Deploys tab)
- ดู build time และ optimize ถ้าช้าเกิน 5 นาที

---

**URL ของคุณจะเป็น:** `https://your-site-name.netlify.app`

Happy deploying! 🚀
