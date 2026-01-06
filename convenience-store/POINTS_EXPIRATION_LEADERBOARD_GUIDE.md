# 🎯 Points Expiration & Leaderboard System - Complete Guide

## ✅ สิ่งที่สร้างเสร็จแล้ว

### 1. Database Migration (024_points_expiration_leaderboard.sql)

#### Tables Created:

- ✅ `loyalty_leaderboard` - เก็บข้อมูลอันดับของผู้ใช้แต่ละ period
- ✅ `leaderboard_rewards` - กำหนดรางวัลสำหรับแต่ละอันดับ
- ✅ `user_leaderboard_rewards` - บันทึกรางวัลที่ผู้ใช้ได้รับ

#### Functions Created:

- ✅ `get_expiring_points()` - ดึงคะแนนที่กำลังจะหมดอายุ
- ✅ `expire_old_points()` - หมดอายุคะแนนที่เกิน 1 ปี
- ✅ `update_leaderboard()` - อัพเดทอันดับและคะแนน
- ✅ `award_leaderboard_rewards()` - มอบรางวัลให้ผู้ที่ติด Top

#### Default Rewards:

**Weekly:**

- 🥇 อันดับ 1: 500 คะแนน
- 🥈 อันดับ 2: 300 คะแนน
- 🥉 อันดับ 3: 200 คะแนน
- 🏆 อันดับ 4-10: 100 คะแนน

**Monthly:**

- 🥇 อันดับ 1: 2,000 คะแนน
- 🥈 อันดับ 2: 1,500 คะแนน
- 🥉 อันดับ 3: 1,000 คะแนน
- 🏆 อันดับ 4-10: 500 คะแนน
- ⭐ อันดับ 11-20: 200 คะแนน

### 2. Composables

#### usePointsExpiration.js

- ✅ `fetchExpiringPoints()` - ดึงคะแนนที่จะหมดอายุภายใน X วัน
- ✅ `totalExpiringPoints` - คะแนนรวมที่จะหมดอายุ
- ✅ `urgentExpiringPoints` - คะแนนที่จะหมดอายุภายใน 7 วัน
- ✅ `groupedByUrgency` - จัดกลุ่มตามความเร่งด่วน (urgent, warning, normal)
- ✅ Helper functions: `formatExpiryDate()`, `getUrgencyColor()`, `getUrgencyBadgeColor()`

#### useLeaderboard.js

- ✅ `fetchLeaderboard()` - ดึงข้อมูล leaderboard ตาม period
- ✅ `fetchLeaderboardRewards()` - ดึงรางวัลที่มี
- ✅ `updateLeaderboard()` - อัพเดทอันดับ (admin only)
- ✅ `topThree`, `topTen` - computed สำหรับ top performers
- ✅ `myPosition` - อันดับของผู้ใช้ปัจจุบัน
- ✅ Helper functions: `getRankBadge()`, `getRankColor()`, `formatPeriodLabel()`

### 3. Components

#### ExpiringPointsAlert.vue

- ✅ แสดงการแจ้งเตือนคะแนนที่จะหมดอายุ
- ✅ แยกระดับความเร่งด่วน (🔴 ≤7 วัน, 🟠 8-14 วัน, 🟡 15-30 วัน)
- ✅ แสดงรายละเอียดคะแนนแต่ละรายการ
- ✅ ปุ่มลิงก์ไปแลกรางวัล

#### LeaderboardView.vue

- ✅ แสดง Leaderboard แบบ real-time
- ✅ Period selector (วันนี้, สัปดาห์นี้, เดือนนี้, ตลอดกาล)
- ✅ My Rank Card - แสดงอันดับและสถิติของผู้ใช้
- ✅ Top 3 Podium - แสดงแชมป์แบบ podium
- ✅ Full Leaderboard - รายชื่อทั้งหมด
- ✅ Rewards Info - แสดงรางวัลที่จะได้รับ
- ✅ Scoring Explanation - อธิบายวิธีคำนวณคะแนน

### 4. Integration

#### LoyaltyView.vue

- ✅ เพิ่ม ExpiringPointsAlert ที่ด้านบน
- ✅ เพิ่ม Leaderboard tab
- ✅ Responsive tabs with horizontal scroll

### 5. Supabase Edge Functions

#### expire-points

- ✅ เรียก `expire_old_points()` function
- ✅ ใช้สำหรับ cron job รายวัน

#### update-leaderboard

- ✅ เรียก `update_leaderboard()` function
- ✅ รองรับ period: daily, weekly, monthly
- ✅ ใช้สำหรับ cron job อัพเดทอันดับ

#### award-leaderboard-rewards

- ✅ เรียก `award_leaderboard_rewards()` function
- ✅ มอบรางวัลให้ผู้ที่ติด Top
- ✅ ใช้สำหรับ cron job ตอนจบ period

---

## 🚀 Setup Instructions

### 1. Run Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually
psql -h <host> -U postgres -d postgres -f supabase/migrations/024_points_expiration_leaderboard.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy expire-points
supabase functions deploy update-leaderboard
supabase functions deploy award-leaderboard-rewards

# Set secrets (if needed)
supabase secrets set SUPABASE_URL=<your-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

### 3. Setup Cron Jobs

ใน Supabase Dashboard > Edge Functions > Cron Jobs:

#### Daily: Expire Points

```
Schedule: 0 0 * * *  (ทุกวันเที่ยงคืน)
Function: expire-points
```

#### Hourly: Update Leaderboard

```
Schedule: 0 * * * *  (ทุกชั่วโมง)
Function: update-leaderboard
Query Params: ?period=daily
```

#### Daily: Update Daily Leaderboard

```
Schedule: 0 23 * * *  (ทุกวัน 23:00)
Function: update-leaderboard
Query Params: ?period=daily
```

#### Weekly: Update & Award

```
Schedule: 0 0 * * 0  (ทุกวันอาทิตย์เที่ยงคืน)
Function 1: update-leaderboard?period=weekly
Function 2: award-leaderboard-rewards?period=weekly
```

#### Monthly: Update & Award

```
Schedule: 0 0 1 * *  (วันที่ 1 ของทุกเดือน)
Function 1: update-leaderboard?period=monthly
Function 2: award-leaderboard-rewards?period=monthly
```

---

## 📊 Scoring System

### คะแนนรวม (Total Score)

```
Total Score = Points Earned + (Challenges × 50) + (Referrals × 100)
```

**ตัวอย่าง:**

```
ผู้ใช้ A:
- คะแนนที่ได้: 1,000
- ภารกิจสำเร็จ: 5 ครั้ง
- แนะนำเพื่อน: 3 คน

Total Score = 1,000 + (5 × 50) + (3 × 100)
            = 1,000 + 250 + 300
            = 1,550 คะแนน
```

### Periods

1. **Daily** - รีเซ็ตทุกวันเที่ยงคืน
2. **Weekly** - รีเซ็ตทุกวันอาทิตย์
3. **Monthly** - รีเซ็ตวันที่ 1 ของทุกเดือน
4. **All Time** - ไม่รีเซ็ต (สะสมตลอดกาล)

---

## 💡 Features Explanation

### 1. Points Expiration System

**วัตถุประสงค์:**

- กระตุ้นให้ผู้ใช้แลกรางวัลก่อนคะแนนหมดอายุ
- ป้องกันการสะสมคะแนนไม่จำกัด
- สร้าง urgency และ engagement

**การทำงาน:**

1. คะแนนทุกรายการมี `expires_at` = 1 ปีจากวันที่ได้รับ
2. ระบบตรวจสอบคะแนนที่จะหมดอายุภายใน 30 วัน
3. แสดงการแจ้งเตือนแบ่งตามความเร่งด่วน:
   - 🔴 Urgent (≤ 7 วัน) - สีแดง
   - 🟠 Warning (8-14 วัน) - สีส้ม
   - 🟡 Normal (15-30 วัน) - สีเหลือง
4. Cron job รันทุกวันเพื่อหมดอายุคะแนนที่เกิน 1 ปี

**Best Practices:**

- ส่ง push notification เมื่อคะแนนใกล้หมดอายุ (30, 14, 7, 3, 1 วัน)
- แสดง banner ที่เด่นชัดในหน้า Loyalty Dashboard
- เสนอรางวัลที่เหมาะสมกับจำนวนคะแนนที่จะหมดอายุ

### 2. Leaderboard System

**วัตถุประสงค์:**

- สร้าง competition และ gamification
- เพิ่ม engagement และ retention
- รางวัลพิเศษสำหรับ top performers

**การทำงาน:**

1. ระบบคำนวณคะแนนรวมจาก 3 ส่วน:
   - คะแนนที่ได้รับ (Points Earned)
   - ภารกิจที่ทำสำเร็จ × 50
   - แนะนำเพื่อนสำเร็จ × 100
2. จัดอันดับตาม Total Score
3. อัพเดทอันดับทุกชั่วโมง (หรือตามที่กำหนด)
4. มอบรางวัลอัตโนมัติเมื่อจบ period

**Periods:**

- **Daily**: แข่งขันรายวัน, รางวัลน้อย, สร้าง daily engagement
- **Weekly**: แข่งขันรายสัปดาห์, รางวัลปานกลาง
- **Monthly**: แข่งขันรายเดือน, รางวัลมาก, สร้าง long-term commitment
- **All Time**: Hall of Fame, ไม่มีรางวัล, แสดงผู้เล่นตัวจริง

**UI Features:**

- Top 3 Podium - แสดงแชมป์แบบเด่นชัด
- My Rank Card - แสดงอันดับและสถิติของตัวเอง
- Full Leaderboard - รายชื่อทั้งหมด
- Rewards Info - แสดงรางวัลที่จะได้รับ
- Scoring Explanation - อธิบายวิธีคำนวณ

---

## 🎨 UI/UX Design Principles

### ExpiringPointsAlert

**Colors:**

- 🔴 Red (Urgent): ≤ 7 วัน - สร้าง urgency สูง
- 🟠 Orange (Warning): 8-14 วัน - เตือนล่วงหน้า
- 🟡 Yellow (Normal): 15-30 วัน - แจ้งเตือนทั่วไป

**Placement:**

- แสดงที่ด้านบนสุดของ Loyalty Dashboard
- Collapsible - สามารถซ่อน/แสดงรายละเอียดได้
- Sticky - ติดอยู่ด้านบนเมื่อ scroll

**Actions:**

- ปุ่ม "แลกรางวัลเลย" - ลิงก์ไปยังแท็บรางวัล
- แสดงจำนวนวันที่เหลือชัดเจน

### LeaderboardView

**Visual Hierarchy:**

1. My Rank Card - เด่นที่สุด (gradient purple-blue)
2. Top 3 Podium - แสดงแชมป์แบบ podium
3. Rewards Info - แสดงรางวัลที่จะได้
4. Full Leaderboard - รายชื่อทั้งหมด

**Badges:**

- 🥇 Gold - อันดับ 1
- 🥈 Silver - อันดับ 2
- 🥉 Bronze - อันดับ 3
- 🏆 Trophy - อันดับ 4-10
- ⭐ Star - อันดับ 11-20
- 🎖️ Medal - อันดับอื่นๆ

**Responsive:**

- Period selector แบบ horizontal scroll
- Tabs แบบ horizontal scroll
- Mobile-first design

---

## ⚠️ Important Considerations

### 1. Performance

**Leaderboard Updates:**

- อัพเดททุกชั่วโมงแทนที่จะเป็น real-time
- ใช้ indexed queries สำหรับ ranking
- Cache results ที่ frontend (5-10 นาที)

**Points Expiration:**

- รันทุกวันเที่ยงคืนเพื่อลด load
- ใช้ batch processing สำหรับ users จำนวนมาก

### 2. Fraud Prevention

**Rate Limiting:**

```javascript
// ตัวอย่าง validation
const LIMITS = {
  max_points_per_day: 1000,
  max_challenges_per_day: 10,
  max_referrals_per_month: 20,
};
```

**Monitoring:**

- ตรวจสอบ users ที่ได้คะแนนผิดปกติ
- Alert เมื่อมี spike ใน leaderboard
- Review top performers ก่อนมอบรางวัล

### 3. Edge Cases

**Points Expiration:**

- ถ้าผู้ใช้แลกรางวัลพร้อมกัน → ใช้ FIFO (First In First Out)
- ถ้าคะแนนไม่พอหลังหมดอายุ → ยกเลิกการแลกรางวัล
- ถ้า cron job fail → retry mechanism

**Leaderboard:**

- Tie breaking: ใช้ `updated_at` (ใครทำก่อนได้อันดับดีกว่า)
- Period transition: มอบรางวัลก่อนรีเซ็ตอันดับ
- User deletion: ลบออกจาก leaderboard อัตโนมัติ

---

## 📈 Analytics & Metrics

### Points Expiration

```sql
-- Expiration Rate
SELECT
  COUNT(*) as total_expirations,
  SUM(ABS(points)) as total_points_expired,
  AVG(ABS(points)) as avg_points_per_expiration
FROM points_transactions
WHERE type = 'expire'
  AND created_at >= NOW() - INTERVAL '30 days';

-- Users with Expiring Points
SELECT
  COUNT(DISTINCT user_id) as users_with_expiring_points,
  SUM(points) as total_expiring_points
FROM points_transactions
WHERE type = 'earn'
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';
```

### Leaderboard

```sql
-- Participation Rate
SELECT
  period,
  COUNT(DISTINCT user_id) as participants,
  AVG(total_score) as avg_score,
  MAX(total_score) as top_score
FROM loyalty_leaderboard
WHERE period_start >= NOW() - INTERVAL '3 months'
GROUP BY period
ORDER BY period_start DESC;

-- Reward Distribution
SELECT
  lr.reward_description,
  COUNT(ulr.id) as times_awarded,
  SUM(ulr.points_awarded) as total_points_awarded
FROM user_leaderboard_rewards ulr
JOIN leaderboard_rewards lr ON lr.id = ulr.reward_id
GROUP BY lr.id
ORDER BY total_points_awarded DESC;
```

---

## 🧪 Testing Checklist

### Points Expiration

- [ ] คะแนนหมดอายุถูกต้องหลัง 1 ปี
- [ ] แสดงการแจ้งเตือนถูกต้องตามความเร่งด่วน
- [ ] Cron job ทำงานทุกวันเที่ยงคืน
- [ ] ส่ง notification เมื่อคะแนนใกล้หมดอายุ
- [ ] UI แสดงข้อมูลถูกต้อง

### Leaderboard

- [ ] คำนวณคะแนนรวมถูกต้อง
- [ ] จัดอันดับถูกต้อง (รวม tie breaking)
- [ ] อัพเดทอันดับทุกชั่วโมง
- [ ] มอบรางวัลถูกต้องเมื่อจบ period
- [ ] UI แสดงอันดับและรางวัลถูกต้อง
- [ ] Period selector ทำงานถูกต้อง
- [ ] My Rank Card แสดงข้อมูลถูกต้อง

---

## 🚀 Next Steps

### Phase 1: Core Features (✅ Done)

- [x] Database schema
- [x] Composables
- [x] UI Components
- [x] Edge Functions

### Phase 2: Enhancements

- [ ] Push notifications สำหรับคะแนนใกล้หมดอายุ
- [ ] Email notifications สำหรับ leaderboard rewards
- [ ] Admin dashboard สำหรับ leaderboard management
- [ ] Analytics dashboard

### Phase 3: Advanced Features

- [ ] Leaderboard history (ดูอันดับย้อนหลัง)
- [ ] Personal best tracking
- [ ] Achievement badges สำหรับ top performers
- [ ] Social sharing (แชร์อันดับ)

---

## 📚 Resources

- [Gamification Best Practices](https://www.gamify.com/gamification-blog/gamification-best-practices)
- [Leaderboard Design Patterns](https://uxdesign.cc/leaderboard-design-patterns-8f7f8f8f8f8f)
- [Points Expiration Strategies](https://www.loyalty360.org/content-gallery/in-depth-exclusives/points-expiration-best-practices)

---

**สร้างเมื่อ:** 5 มกราคม 2026  
**เวอร์ชัน:** 1.0.0  
**สถานะ:** Ready for Production
