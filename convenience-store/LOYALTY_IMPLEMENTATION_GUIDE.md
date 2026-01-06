# 🎯 Loyalty & Referral System - Implementation Guide

## ✅ สิ่งที่สร้างเสร็จแล้ว

### 1. Database Migrations

#### Migration 022: Loyalty Program

- ✅ `loyalty_tiers` - 4 ระดับสมาชิก (Member, Silver, Gold, Platinum)
- ✅ `user_loyalty` - สถานะคะแนนของผู้ใช้
- ✅ `points_transactions` - ประวัติการรับ/ใช้คะแนน
- ✅ `loyalty_rewards` - รางวัลที่แลกได้
- ✅ `user_rewards` - รางวัลที่ผู้ใช้แลกไปแล้ว
- ✅ `loyalty_challenges` - ภารกิจรับคะแนน
- ✅ `user_challenge_progress` - ความคืบหน้าภารกิจ
- ✅ Auto-functions: `calculate_order_points()`, `award_order_points()`, `update_user_tier()`, `update_challenge_progress()`, `redeem_loyalty_reward()`
- ✅ Trigger: `award_points_on_order` - มอบคะแนนอัตโนมัติเมื่อ order confirmed

#### Migration 023: Referral System

- ✅ `referral_codes` - รหัสแนะนำเพื่อนของผู้ใช้
- ✅ `referrals` - ประวัติการแนะนำเพื่อน
- ✅ Functions: `generate_referral_code()`, `process_referral()`, `award_referrer_on_first_purchase()`
- ✅ Trigger: `award_referrer_trigger` - มอบคะแนนให้ผู้แนะนำเมื่อเพื่อนซื้อครั้งแรก

### 2. Composables

#### useLoyalty.js

- ✅ `fetchUserLoyalty()` - ดึงสถานะคะแนนของผู้ใช้
- ✅ `fetchTiers()` - ดึงข้อมูลระดับสมาชิกทั้งหมด
- ✅ `fetchTransactions()` - ดึงประวัติการรับ/ใช้คะแนน
- ✅ `fetchRewards()` - ดึงรางวัลที่แลกได้
- ✅ `fetchUserRewards()` - ดึงรางวัลที่ผู้ใช้แลกไปแล้ว
- ✅ `fetchChallenges()` - ดึงภารกิจที่เปิดอยู่
- ✅ `fetchChallengeProgress()` - ดึงความคืบหน้าภารกิจ
- ✅ `redeemReward()` - แลกรางวัล
- ✅ Computed: `nextTier`, `tierProgress`, `pointsToNextTier`, `affordableRewards`, `activeUserRewards`, `challengesWithProgress`

#### useReferral.js

- ✅ `fetchReferralCode()` - ดึงรหัสแนะนำเพื่อน (สร้างใหม่ถ้ายังไม่มี)
- ✅ `fetchReferrals()` - ดึงรายชื่อเพื่อนที่แนะนำ
- ✅ `applyReferralCode()` - ใช้รหัสแนะนำเพื่อน (สำหรับสมาชิกใหม่)
- ✅ `shareReferral()` - แชร์ลิงก์แนะนำเพื่อน (Web Share API)
- ✅ `copyCode()` - คัดลอกรหัสแนะนำเพื่อน
- ✅ Computed: `referralUrl`, `stats` (totalReferrals, completedReferrals, pendingReferrals, totalEarned)

### 3. Admin Dashboard Views

#### AdminLoyalty.vue

- ✅ Overview Stats (Total Members, Active Members, Points Issued, Redemption Rate)
- ✅ Tier Distribution Chart
- ✅ Recent Transactions Table
- ✅ Quick Actions (จัดการรางวัล, จัดการภารกิจ, Export รายงาน)

#### AdminRewards.vue

- ✅ Rewards Management Table
- ✅ Create/Edit Reward Modal
- ✅ Toggle Reward Status
- ✅ Support all reward types (discount_percentage, discount_fixed, free_product, free_shipping, early_access, exclusive_product)

#### AdminChallenges.vue

- ✅ Challenges Grid with Cards
- ✅ Create/Edit Challenge Modal
- ✅ Toggle Challenge Status
- ✅ Completion Rate Display
- ✅ Support all challenge types (purchase_count, purchase_amount, category_purchase, streak, referral, review, share)

### 4. Customer Views

#### LoyaltyView.vue

- ✅ Points Card with Tier Badge
- ✅ Tier Progress Bar
- ✅ Stats (Lifetime Points, Current Streak, Active Rewards)
- ✅ 4 Tabs: Rewards, Challenges, My Rewards, History
- ✅ Redeem Rewards Functionality
- ✅ Challenge Progress Display
- ✅ Transaction History
- ✅ My Rewards with Codes

### 5. Router Configuration

- ✅ `/admin/loyalty` - Admin Loyalty Dashboard
- ✅ `/admin/loyalty/rewards` - Admin Rewards Management
- ✅ `/admin/loyalty/challenges` - Admin Challenges Management
- ✅ `/customer/loyalty` - Customer Loyalty Dashboard

### 6. Documentation

- ✅ `LOYALTY_SYSTEM_COMPLETE.md` - Complete system documentation
- ✅ `LOYALTY_IMPLEMENTATION_GUIDE.md` - This file

---

## 🚀 การใช้งาน

### สำหรับ Admin

1. **เข้าสู่ระบบ Admin**

   ```
   http://localhost:5173/admin/login
   ```

2. **จัดการ Loyalty Program**

   - Dashboard: `/admin/loyalty`
   - สร้าง/แก้ไขรางวัล: `/admin/loyalty/rewards`
   - สร้าง/แก้ไขภารกิจ: `/admin/loyalty/challenges`

3. **สร้างรางวัลใหม่**

   ```javascript
   {
     name: "ส่วนลด 50 บาท",
     points_cost: 500,
     reward_type: "discount_fixed",
     reward_value: { amount: 50 },
     valid_days: 30,
     is_active: true
   }
   ```

4. **สร้างภารกิจใหม่**
   ```javascript
   {
     name: "ซื้อครบ 5 ครั้งในเดือนนี้",
     challenge_type: "purchase_count",
     target_value: 5,
     reward_points: 100,
     is_recurring: true,
     recurrence_period: "monthly"
   }
   ```

### สำหรับลูกค้า

1. **ดูคะแนนและระดับสมาชิก**

   ```
   http://localhost:5173/customer/loyalty
   ```

2. **แลกรางวัล**

   - เลือกรางวัลที่ต้องการ
   - กดปุ่ม "แลก"
   - รับรหัสรางวัลที่แท็บ "รางวัลของฉัน"

3. **ทำภารกิจ**

   - ดูภารกิจที่เปิดอยู่ที่แท็บ "ภารกิจ"
   - ทำตามเงื่อนไข (ซื้อสินค้า, ชวนเพื่อน, รีวิว)
   - รับคะแนนอัตโนมัติเมื่อทำสำเร็จ

4. **แนะนำเพื่อน**
   - ไปที่ `/customer/referral`
   - แชร์รหัสหรือลิงก์ให้เพื่อน
   - เพื่อนสมัครและใช้รหัส → รับ 50 คะแนนทันที
   - เพื่อนซื้อครั้งแรก → คุณรับ 100 คะแนน

---

## 📊 Points System

### การรับคะแนน

**จากการซื้อสินค้า:**

- Base rate: 1 คะแนนต่อ 10 บาท
- Tier multiplier:
  - Member (Level 1): 1.0x
  - Silver (Level 2): 1.2x
  - Gold (Level 3): 1.5x
  - Platinum (Level 4): 2.0x

**ตัวอย่าง:**

```
ซื้อ 500 บาท
- Member: 50 คะแนน
- Silver: 60 คะแนน
- Gold: 75 คะแนน
- Platinum: 100 คะแนน
```

**จากภารกิจ:**

- ทำภารกิจสำเร็จ → รับคะแนนตามที่กำหนด
- ภารกิจแบบ recurring สามารถทำซ้ำได้ (daily, weekly, monthly)

**จากการแนะนำเพื่อน:**

- เพื่อนสมัครใหม่ → เพื่อนรับ 50 คะแนนทันที
- เพื่อนซื้อครั้งแรก → คุณรับ 100 คะแนน

### การใช้คะแนน

- แลกรางวัลต่างๆ ตามคะแนนที่มี
- ตรวจสอบระดับสมาชิกก่อนแลก (บางรางวัลต้องเป็น Silver ขึ้นไป)
- คะแนนหมดอายุใน 1 ปี (ต้องตั้ง cron job)

---

## ⚙️ Setup Instructions

### 1. Run Migrations

```bash
# ใน Supabase Dashboard หรือ CLI
psql -h <host> -U postgres -d postgres -f supabase/migrations/022_loyalty_program.sql
psql -h <host> -U postgres -d postgres -f supabase/migrations/023_referral_system.sql
```

หรือใช้ Supabase CLI:

```bash
supabase db push
```

### 2. Insert Sample Data (Optional)

```sql
-- Sample Rewards
INSERT INTO loyalty_rewards (name, name_en, description, points_cost, reward_type, reward_value, valid_days) VALUES
('ส่วนลด 50 บาท', '50 Baht Discount', 'ส่วนลดสำหรับการซื้อครั้งถัดไป', 500, 'discount_fixed', '{"amount": 50}', 30),
('ส่วนลด 10%', '10% Discount', 'ส่วนลด 10% สูงสุด 100 บาท', 300, 'discount_percentage', '{"percentage": 10, "max_amount": 100}', 30),
('ส่งฟรี', 'Free Shipping', 'ส่งฟรีไม่จำกัดระยะทาง', 200, 'free_shipping', '{}', 30);

-- Sample Challenges
INSERT INTO loyalty_challenges (name, name_en, description, challenge_type, target_value, reward_points, is_recurring, recurrence_period) VALUES
('ซื้อครบ 5 ครั้ง', 'Buy 5 Times', 'ซื้อสินค้าครบ 5 ครั้งในเดือนนี้', 'purchase_count', 5, 100, true, 'monthly'),
('ซื้อครบ 1,000 บาท', 'Spend 1,000 Baht', 'ซื้อสินค้ารวมครบ 1,000 บาทในเดือนนี้', 'purchase_amount', 1000, 150, true, 'monthly'),
('ชวนเพื่อน 3 คน', 'Refer 3 Friends', 'ชวนเพื่อนสมัครสมาชิกครบ 3 คน', 'referral', 3, 300, false, null);
```

### 3. Test the System

1. **สร้างบัญชีผู้ใช้ใหม่**
2. **ทำการสั่งซื้อสินค้า** → ตรวจสอบว่าได้รับคะแนนอัตโนมัติ
3. **ไปที่ `/customer/loyalty`** → ดูคะแนนและระดับสมาชิก
4. **แลกรางวัล** → ตรวจสอบว่าได้รับรหัสรางวัล
5. **ทดสอบ Referral** → สร้างบัญชีใหม่ด้วยรหัสแนะนำเพื่อน

---

## 🔧 Advanced Features (TODO)

### 1. Points Expiration Cron Job

```javascript
// Supabase Edge Function: expire-points
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Call expire_old_points function
  const { error } = await supabase.rpc("expire_old_points");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Setup Cron:**

```bash
# ใน Supabase Dashboard > Edge Functions > Cron Jobs
# Schedule: 0 0 * * * (ทุกวันเที่ยงคืน)
```

### 2. Push Notifications for Points

```javascript
// ส่ง notification เมื่อ:
// - ได้รับคะแนนจากการซื้อ
// - ทำภารกิจสำเร็จ
// - คะแนนใกล้หมดอายุ (30 วันก่อน)
// - มีรางวัลใหม่
// - เพื่อนที่แนะนำซื้อครั้งแรก

import { usePushNotifications } from "@/composables/usePushNotifications";

const { sendNotification } = usePushNotifications();

// ตัวอย่าง
await sendNotification({
  title: "คุณได้รับคะแนน!",
  body: "รับ 50 คะแนนจากการซื้อสินค้า",
  icon: "/icon-192.png",
  url: "/customer/loyalty",
});
```

### 3. Analytics Dashboard

```sql
-- Monthly Points Activity
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) as earned,
  SUM(CASE WHEN type = 'redeem' THEN ABS(points) ELSE 0 END) as redeemed,
  COUNT(DISTINCT user_id) as active_users
FROM points_transactions
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- Top Redeemers
SELECT
  p.full_name,
  p.email,
  COUNT(ur.id) as redemptions,
  SUM(ur.points_spent) as total_points_spent
FROM user_rewards ur
JOIN profiles p ON p.id = ur.user_id
GROUP BY p.id
ORDER BY total_points_spent DESC
LIMIT 10;

-- Challenge Completion Rate
SELECT
  lc.name,
  COUNT(DISTINCT ucp.user_id) as participants,
  COUNT(DISTINCT CASE WHEN ucp.completed THEN ucp.user_id END) as completers,
  ROUND(
    COUNT(DISTINCT CASE WHEN ucp.completed THEN ucp.user_id END) * 100.0 /
    NULLIF(COUNT(DISTINCT ucp.user_id), 0),
    2
  ) as completion_rate
FROM loyalty_challenges lc
LEFT JOIN user_challenge_progress ucp ON ucp.challenge_id = lc.id
GROUP BY lc.id
ORDER BY completion_rate DESC;
```

### 4. Fraud Prevention

```javascript
// Rate Limiting
const RATE_LIMITS = {
  max_points_per_day: 1000,
  max_transactions_per_hour: 10,
  min_order_amount: 10,
};

// Validation
async function validatePointsEarning(userId, points) {
  // Check daily limit
  const today = await getTodayPoints(userId);
  if (today + points > RATE_LIMITS.max_points_per_day) {
    throw new Error("Daily points limit exceeded");
  }

  // Check transaction frequency
  const recentCount = await getRecentTransactionCount(userId, 1);
  if (recentCount >= RATE_LIMITS.max_transactions_per_hour) {
    throw new Error("Too many transactions");
  }

  return true;
}
```

---

## 📈 Success Metrics

### KPIs to Track

1. **Enrollment Rate**: % ของลูกค้าที่เข้าร่วม loyalty program
2. **Active Rate**: % ของสมาชิกที่ active (ซื้อใน 90 วันล่าสุด)
3. **Redemption Rate**: % ของคะแนนที่ถูกแลก
4. **Tier Progression**: เวลาเฉลี่ยในการอัพเกรด tier
5. **Challenge Completion**: % ของภารกิจที่สำเร็จ
6. **Referral Conversion**: % ของ referral ที่กลายเป็นลูกค้า
7. **LTV Increase**: เพิ่มขึ้นของ customer lifetime value

---

## 🐛 Troubleshooting

### ไม่ได้รับคะแนนหลังสั่งซื้อ

1. ตรวจสอบว่า order status เป็น `confirmed`
2. ตรวจสอบ trigger `award_points_on_order` ทำงานหรือไม่
3. ดู logs ใน `points_transactions` table

### แลกรางวัลไม่ได้

1. ตรวจสอบคะแนนที่มีเพียงพอหรือไม่
2. ตรวจสอบระดับสมาชิกตรงตาม `min_tier_level` หรือไม่
3. ตรวจสอบ stock ของรางวัล

### Referral ไม่ทำงาน

1. ตรวจสอบว่าใช้รหัสถูกต้องหรือไม่
2. ตรวจสอบว่าผู้ใช้ยังไม่เคยใช้รหัสแนะนำเพื่อนมาก่อน
3. ตรวจสอบ trigger `award_referrer_trigger` ทำงานหรือไม่

---

## 📚 Resources

- [Loyalty Program Best Practices](https://www.shopify.com/retail/loyalty-programs)
- [Gamification in E-commerce](https://www.bigcommerce.com/articles/ecommerce/gamification/)
- [Referral Marketing Guide](https://referralrock.com/blog/referral-marketing-guide/)
- [Supabase Documentation](https://supabase.com/docs)

---

## ✅ Checklist

- [x] Database migrations created
- [x] Composables implemented
- [x] Admin dashboard views created
- [x] Customer loyalty view created
- [x] Router configuration updated
- [x] Admin layout menu updated
- [ ] Points expiration cron job setup
- [ ] Push notifications integration
- [ ] Analytics dashboard implementation
- [ ] Fraud prevention implementation
- [ ] Testing and QA
- [ ] Production deployment

---

**สร้างเมื่อ:** 5 มกราคม 2026  
**เวอร์ชัน:** 1.0.0  
**สถานะ:** Ready for Testing
