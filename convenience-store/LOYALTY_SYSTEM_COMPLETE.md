# 🎁 Complete Loyalty & Referral System Guide

## Overview

ระบบ Loyalty Program และ Referral ที่สมบูรณ์แบบพร้อม Admin Dashboard, Analytics, และ Gamification

---

## 📊 System Architecture

### Database Tables (Migration 022)

```
✅ loyalty_tiers - ระดับสมาชิก (Member, Silver, Gold, Platinum)
✅ user_loyalty - สถานะ loyalty ของผู้ใช้
✅ points_transactions - ประวัติการรับ/ใช้คะแนน
✅ loyalty_rewards - รางวัลที่แลกได้
✅ user_rewards - รางวัลที่ผู้ใช้แลกไปแล้ว
✅ loyalty_challenges - ภารกิจรับคะแนน
✅ user_challenge_progress - ความคืบหน้าภารกิจ
```

### Auto Functions

```sql
✅ calculate_order_points() - คำนวณคะแนนจากยอดซื้อ
✅ award_order_points() - มอบคะแนนอัตโนมัติ
✅ update_user_tier() - อัพเกรดระดับอัตโนมัติ
✅ update_challenge_progress() - อัพเดทความคืบหน้าภารกิจ
✅ redeem_loyalty_reward() - แลกของรางวัล
```

---

## 🎮 Features

### 1. Points System

**การรับคะแนน:**

- 1 คะแนนต่อ 10 บาท (base rate)
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

### 2. Tier System

| Tier     | Points Required | Benefits                             |
| -------- | --------------- | ------------------------------------ |
| Member   | 0-999           | คะแนน 1x                             |
| Silver   | 1,000-4,999     | คะแนน 1.2x, ส่วนลด 5%                |
| Gold     | 5,000-14,999    | คะแนน 1.5x, ส่วนลด 10%, Early Access |
| Platinum | 15,000+         | คะแนน 2x, ส่วนลด 15%, VIP Rewards    |

### 3. Rewards Catalog

**ประเภทรางวัล:**

- `discount_percentage` - ส่วนลด %
- `discount_fixed` - ส่วนลดเงินคงที่
- `free_product` - สินค้าฟรี
- `free_shipping` - ส่งฟรี
- `early_access` - เข้าถึง Flash Sale ก่อน
- `exclusive_product` - สินค้าพิเศษ

**ตัวอย่างรางวัล:**

```javascript
{
  name: "ส่วนลด 50 บาท",
  points_cost: 500,
  reward_type: "discount_fixed",
  reward_value: { amount: 50 },
  valid_days: 30
}
```

### 4. Challenges System

**ประเภทภารกิจ:**

- `purchase_count` - ซื้อครบ X ครั้ง
- `purchase_amount` - ซื้อครบ X บาท
- `category_purchase` - ซื้อในหมวดหมู่
- `streak` - ซื้อติดต่อกัน X วัน
- `referral` - ชวนเพื่อน X คน
- `review` - รีวิวสินค้า X ชิ้น
- `share` - แชร์สินค้า X ครั้ง

**ตัวอย่าง:**

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

### 5. Streak System

- ซื้อติดต่อกันทุกวัน = โบนัสคะแนน
- Track `current_streak` และ `longest_streak`
- Reset ถ้าไม่ซื้อเกิน 2 วัน

---

## 🔧 Admin Dashboard

### Required Admin Views

#### 1. AdminLoyalty.vue

```vue
<template>
  <div class="admin-loyalty">
    <!-- Overview Stats -->
    <div class="stats-grid">
      <StatCard title="Total Members" :value="stats.totalMembers" />
      <StatCard title="Active This Month" :value="stats.activeMembers" />
      <StatCard title="Points Issued" :value="stats.pointsIssued" />
      <StatCard title="Redemption Rate" :value="stats.redemptionRate + '%'" />
    </div>

    <!-- Tier Distribution -->
    <TierDistributionChart :data="tierData" />

    <!-- Recent Transactions -->
    <PointsTransactionsTable :transactions="recentTransactions" />

    <!-- Quick Actions -->
    <div class="actions">
      <button @click="openRewardModal">Create Reward</button>
      <button @click="openChallengeModal">Create Challenge</button>
      <button @click="exportReport">Export Report</button>
    </div>
  </div>
</template>
```

#### 2. AdminRewards.vue

```vue
<template>
  <div class="admin-rewards">
    <h2>Rewards Management</h2>

    <!-- Rewards List -->
    <table>
      <thead>
        <tr>
          <th>Reward</th>
          <th>Points Cost</th>
          <th>Type</th>
          <th>Stock</th>
          <th>Redeemed</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reward in rewards" :key="reward.id">
          <td>{{ reward.name }}</td>
          <td>{{ reward.points_cost }}</td>
          <td>{{ reward.reward_type }}</td>
          <td>{{ reward.stock || "∞" }}</td>
          <td>{{ reward.redeemed_count }}</td>
          <td>
            <badge :active="reward.is_active" />
          </td>
          <td>
            <button @click="editReward(reward)">Edit</button>
            <button @click="deleteReward(reward.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

#### 3. AdminChallenges.vue

```vue
<template>
  <div class="admin-challenges">
    <h2>Challenges Management</h2>

    <!-- Active Challenges -->
    <div class="challenges-grid">
      <ChallengeCard
        v-for="challenge in challenges"
        :key="challenge.id"
        :challenge="challenge"
        @edit="editChallenge"
        @delete="deleteChallenge"
      />
    </div>

    <!-- Challenge Performance -->
    <ChallengeAnalytics :challenges="challenges" />
  </div>
</template>
```

### Analytics Queries

```sql
-- Tier Distribution
SELECT
  lt.name,
  lt.level,
  COUNT(ul.id) as member_count,
  ROUND(COUNT(ul.id) * 100.0 / SUM(COUNT(ul.id)) OVER(), 2) as percentage
FROM loyalty_tiers lt
LEFT JOIN user_loyalty ul ON ul.tier_id = lt.id
GROUP BY lt.id, lt.name, lt.level
ORDER BY lt.level;

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
```

---

## 🔗 Referral System

### Database Schema (Migration 023)

```sql
-- Referral Codes
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  referrer_reward_points INTEGER,
  referred_reward_points INTEGER,
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 6));

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_points INTEGER := 100;
  v_referred_points INTEGER := 50;
BEGIN
  -- Get referrer
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    referrer_reward_points,
    referred_reward_points
  ) VALUES (
    v_referrer_id,
    p_referred_id,
    p_referral_code,
    v_referrer_points,
    v_referred_points
  );

  -- Update code usage
  UPDATE referral_codes
  SET uses_count = uses_count + 1
  WHERE code = p_referral_code;

  -- Award points to referred user immediately
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    source,
    description
  ) VALUES (
    p_referred_id,
    v_referred_points,
    'earn',
    'referral',
    'คะแนนต้อนรับจากการสมัครผ่านเพื่อน'
  );

  UPDATE user_loyalty
  SET
    total_points = total_points + v_referred_points,
    available_points = available_points + v_referred_points,
    lifetime_points = lifetime_points + v_referred_points
  WHERE user_id = p_referred_id;
END;
$$;

-- Trigger to award referrer when referred makes first purchase
CREATE OR REPLACE FUNCTION award_referrer_on_first_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Check if this is first completed order
  IF NEW.status = 'confirmed' AND NOT EXISTS (
    SELECT 1 FROM orders
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND status = 'confirmed'
  ) THEN
    -- Get pending referral
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_id = NEW.user_id
    AND status = 'pending';

    IF FOUND THEN
      -- Award points to referrer
      INSERT INTO points_transactions (
        user_id,
        points,
        type,
        source,
        reference_id,
        description
      ) VALUES (
        v_referral.referrer_id,
        v_referral.referrer_reward_points,
        'earn',
        'referral',
        v_referral.id,
        'คะแนนจากการชวนเพื่อน'
      );

      UPDATE user_loyalty
      SET
        total_points = total_points + v_referral.referrer_reward_points,
        available_points = available_points + v_referral.referrer_reward_points,
        lifetime_points = lifetime_points + v_referral.referrer_reward_points
      WHERE user_id = v_referral.referrer_id;

      -- Update referral status
      UPDATE referrals
      SET
        status = 'rewarded',
        completed_at = NOW(),
        rewarded_at = NOW()
      WHERE id = v_referral.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER award_referrer_trigger
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_referrer_on_first_purchase();
```

### Frontend Implementation

#### useReferral.js

```javascript
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export function useReferral() {
  const authStore = useAuthStore();
  const referralCode = ref(null);
  const referrals = ref([]);
  const loading = ref(false);

  // Get user's referral code
  const fetchReferralCode = async () => {
    if (!authStore.isLoggedIn) return;

    const { data, error } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", authStore.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching referral code:", error);
      return;
    }

    if (!data) {
      // Generate new code
      const code = await generateCode();
      referralCode.value = code;
    } else {
      referralCode.value = data;
    }
  };

  // Generate referral code
  const generateCode = async () => {
    const { data, error } = await supabase.rpc("generate_referral_code", {
      p_user_id: authStore.user.id,
    });

    if (error) throw error;

    // Insert code
    const { data: newCode, error: insertError } = await supabase
      .from("referral_codes")
      .insert({
        user_id: authStore.user.id,
        code: data,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newCode;
  };

  // Get referral stats
  const fetchReferrals = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(
          `
          *,
          referred:profiles!referrals_referred_id_fkey(full_name, email)
        `
        )
        .eq("referrer_id", authStore.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      referrals.value = data || [];
    } finally {
      loading.value = false;
    }
  };

  // Apply referral code (for new users)
  const applyReferralCode = async (code) => {
    try {
      await supabase.rpc("process_referral", {
        p_referred_id: authStore.user.id,
        p_referral_code: code.toUpperCase(),
      });
      return true;
    } catch (error) {
      console.error("Error applying referral code:", error);
      throw error;
    }
  };

  // Share referral link
  const shareReferral = async () => {
    const url = `${window.location.origin}/register?ref=${referralCode.value.code}`;
    const text = `ใช้โค้ด ${referralCode.value.code} สมัครสมาชิกรับคะแนนฟรี!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "ชวนเพื่อน", text, url });
      } catch (e) {
        if (e.name !== "AbortError") {
          await navigator.clipboard.writeText(url);
          alert("คัดลอกลิงก์แล้ว!");
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("คัดลอกลิงก์แล้ว!");
    }
  };

  const stats = computed(() => ({
    totalReferrals: referrals.value.length,
    completedReferrals: referrals.value.filter((r) => r.status === "rewarded")
      .length,
    pendingReferrals: referrals.value.filter((r) => r.status === "pending")
      .length,
    totalEarned: referrals.value
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + r.referrer_reward_points, 0),
  }));

  return {
    referralCode: computed(() => referralCode.value),
    referrals: computed(() => referrals.value),
    stats,
    loading: computed(() => loading.value),
    fetchReferralCode,
    fetchReferrals,
    applyReferralCode,
    shareReferral,
  };
}
```

---

## ⚠️ Important Considerations

### 1. Points Expiration

```sql
-- Cron job to expire points (run daily)
CREATE OR REPLACE FUNCTION expire_old_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get expired points
  WITH expired AS (
    SELECT
      user_id,
      SUM(points) as expired_points
    FROM points_transactions
    WHERE type = 'earn'
      AND expires_at < NOW()
      AND id NOT IN (
        SELECT reference_id
        FROM points_transactions
        WHERE type = 'expire'
      )
    GROUP BY user_id
  )
  -- Create expiration transactions
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    source,
    description
  )
  SELECT
    user_id,
    -expired_points,
    'expire',
    'manual',
    'คะแนนหมดอายุ'
  FROM expired;

  -- Update user loyalty
  UPDATE user_loyalty ul
  SET available_points = available_points - e.expired_points
  FROM expired e
  WHERE ul.user_id = e.user_id;
END;
$$;
```

### 2. Fraud Prevention

```javascript
// Rate limiting for points earning
const RATE_LIMITS = {
  max_points_per_day: 1000,
  max_transactions_per_hour: 10,
  min_order_amount: 10,
};

// Validation before awarding points
async function validatePointsEarning(userId, points) {
  // Check daily limit
  const today = await getTodayPoints(userId);
  if (today + points > RATE_LIMITS.max_points_per_day) {
    throw new Error("Daily points limit exceeded");
  }

  // Check transaction frequency
  const recentCount = await getRecentTransactionCount(userId, 1); // 1 hour
  if (recentCount >= RATE_LIMITS.max_transactions_per_hour) {
    throw new Error("Too many transactions");
  }

  return true;
}
```

### 3. Notification System

```javascript
// Notify users 30 days before points expire
async function notifyExpiringPoints() {
  const expiringPoints = await supabase
    .from("points_transactions")
    .select("user_id, points, expires_at")
    .eq("type", "earn")
    .gte("expires_at", new Date())
    .lte("expires_at", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  for (const record of expiringPoints.data) {
    await sendPushNotification(record.user_id, {
      title: "คะแนนใกล้หมดอายุ!",
      body: `คะแนน ${record.points} จะหมดอายุใน 30 วัน`,
      url: "/customer/rewards",
    });
  }
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

### Dashboard Metrics

```sql
-- Overall Program Health
SELECT
  COUNT(DISTINCT ul.user_id) as total_members,
  COUNT(DISTINCT CASE WHEN ul.last_purchase_date >= NOW() - INTERVAL '90 days'
    THEN ul.user_id END) as active_members,
  SUM(ul.total_points) as total_points_issued,
  SUM(ul.available_points) as available_points,
  COUNT(DISTINCT ur.id) as total_redemptions,
  ROUND(
    COUNT(DISTINCT ur.id) * 100.0 /
    NULLIF(COUNT(DISTINCT ul.user_id), 0),
    2
  ) as redemption_rate
FROM user_loyalty ul
LEFT JOIN user_rewards ur ON ur.user_id = ul.user_id;
```

---

## 🚀 Next Steps

1. **Implement Admin Dashboard** - สร้าง UI สำหรับจัดการ
2. **Add Analytics** - Dashboard แสดง metrics
3. **Setup Cron Jobs** - Points expiration, notifications
4. **Create Customer UI** - หน้าแสดงคะแนน, rewards, challenges
5. **Testing** - ทดสอบ edge cases และ fraud scenarios
6. **Documentation** - User guide และ admin manual

---

## 📚 Resources

- [Loyalty Program Best Practices](https://www.shopify.com/retail/loyalty-programs)
- [Gamification in E-commerce](https://www.bigcommerce.com/articles/ecommerce/gamification/)
- [Referral Marketing Guide](https://referralrock.com/blog/referral-marketing-guide/)
