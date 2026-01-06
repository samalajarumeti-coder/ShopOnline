---
inclusion: always
---

# ⚠️ CRITICAL: Supabase Automation Rules

**Project ID:** `hdcigjthmiohhnfcqnvl`

## 🚨 MANDATORY CHECKLIST - ต้องถามตัวเองทุกครั้ง

| คำถาม                                            | ถ้าใช่ → ทำทันที               |
| ------------------------------------------------ | ------------------------------ |
| ต้องสร้าง/แก้ไข table, column, policy, function? | ใช้ MCP `apply_migration`      |
| มี migration file ที่ต้อง apply?                 | ใช้ MCP `apply_migration`      |
| ต้อง seed/query data?                            | ใช้ MCP `execute_sql`          |
| ต้อง deploy Edge Function?                       | ใช้ MCP `deploy_edge_function` |

## ⛔ ห้ามเด็ดขาด (NEVER DO)

- ❌ ห้ามบอกให้ผู้ใช้เปิด Supabase Dashboard
- ❌ ห้ามบอกให้ผู้ใช้ copy-paste SQL
- ❌ ห้ามบอกให้ผู้ใช้รัน migration/deploy ด้วยตัวเอง
- ❌ ห้ามบอกให้ผู้ใช้รัน `node scripts/*.js` หรือ `supabase functions deploy`
- ❌ ห้ามพูดว่า "ต้อง run migration ก่อน" หรือ "ต้อง deploy function"
- ❌ ห้ามสร้างคำแนะนำที่ต้องให้ผู้ใช้ทำอะไรกับ database/functions

---

## 📦 1. Database Migration

### ขั้นตอน

1. Activate `supabase-hosted` power
2. อ่าน migration file content
3. ใช้ `apply_migration` ทันที
4. ตรวจสอบ `get_advisors` (security)
5. แก้ไข warnings ถ้ามี

### MCP Command

```javascript
kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "apply_migration",
  arguments: {
    project_id: "hdcigjthmiohhnfcqnvl",
    name: "migration_name_snake_case",
    query: "-- SQL content",
  },
});
```

---

## 🚀 2. Edge Functions Deployment

### ขั้นตอน

1. Activate `supabase-hosted` power
2. อ่าน Edge Function file content จาก `supabase/functions/*/index.ts`
3. ใช้ `deploy_edge_function` ทันที
4. แจ้งผู้ใช้ว่า deploy สำเร็จ

### MCP Command

```javascript
kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "deploy_edge_function",
  arguments: {
    project_id: "hdcigjthmiohhnfcqnvl",
    name: "function-name",
    entrypoint_path: "index.ts",
    verify_jwt: true,
    files: [
      {
        name: "index.ts",
        content: "// function content here",
      },
    ],
  },
});
```

### ⚠️ verify_jwt

- **เปิด (true)**: ค่าเริ่มต้น ต้องมี JWT ใน Authorization header
- **ปิด (false)**: เฉพาะเมื่อ function ใช้ authentication แบบอื่น (API key, webhook, cron) หรือผู้ใช้ขอปิดโดยเฉพาะ

---

## 🔍 3. Security Check

### หลัง apply migration ทุกครั้ง

```javascript
kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "get_advisors",
  arguments: {
    project_id: "hdcigjthmiohhnfcqnvl",
    type: "security",
  },
});
```

---

## 📊 4. Execute SQL (Query/Seed)

```javascript
kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "execute_sql",
  arguments: {
    project_id: "hdcigjthmiohhnfcqnvl",
    query: "-- SQL query",
  },
});
```

---

## 📋 Decision Flow

```
งานเกี่ยวกับ Supabase?
    │
    ├─ Database (table/column/policy/function)?
    │       │
    │       └─► ใช้ MCP apply_migration ทันที
    │
    ├─ Edge Function?
    │       │
    │       └─► ใช้ MCP deploy_edge_function ทันที
    │
    ├─ Query/Seed data?
    │       │
    │       └─► ใช้ MCP execute_sql ทันที
    │
    └─ ไม่เกี่ยว ──► ดำเนินการปกติ
```

---

## 🎯 เป้าหมาย

**ผู้ใช้ไม่ต้องทำอะไรกับ Supabase เลย - ทุกอย่างทำผ่าน MCP โดยอัตโนมัติ**
