# 🚀 Quick Start Guide

## ✅ All 32+ Features Ready to Use!

### 📋 Pre-requisites

- Node.js 18+ installed
- Supabase project created
- Environment variables configured

---

## 🎯 Step-by-Step Setup

### 1️⃣ Database Migration (REQUIRED)

```bash
# Option A: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open file: supabase/migrations/018_achievements_system.sql
4. Click "Run"
5. Verify tables created: user_achievements, referrals
```

```bash
# Option B: Using Supabase CLI
supabase db push
```

### 2️⃣ Start Development Server

```bash
cd convenience-store
npm run dev
```

### 3️⃣ Access the Application

```
http://localhost:5173/customer/profile
```

---

## 🎨 Feature Tour

### 🏠 Profile Page

**URL**: `/customer/profile`

**Features**:

- ✅ Pull-to-refresh (drag down to refresh)
- ✅ Stats cards (points, orders, wishlist)
- ✅ Grouped menu sections
- ✅ Skeleton loading
- ✅ Achievements & Referral links

**Test**:

1. Login as a user
2. Drag down to refresh
3. Check stats update
4. Navigate through menu items

---

### 🏆 Achievements System

**URL**: `/customer/achievements`

**Features**:

- ✅ 15 different achievements
- ✅ Progress tracking
- ✅ Category grouping
- ✅ Points rewards
- ✅ Unlock animations

**Test**:

1. View locked achievements
2. Complete actions (order, wishlist)
3. See achievement unlock
4. Check points awarded

**Achievement Types**:

- 🛒 Orders: first_order, order_5, order_10, order_50
- 💰 Spending: spend_1000, spend_5000, spend_10000
- 👥 Social: referral_1, review_master
- ⭐ Special: early_bird, night_owl, birthday_order, streak_7, complete_profile

---

### 🤝 Referral System

**URL**: `/customer/referral`

**Features**:

- ✅ Unique referral code
- ✅ Copy & share functionality
- ✅ Referral statistics
- ✅ Rewards tracking

**Test**:

1. Copy your referral code
2. Share with friends
3. Friend registers with code
4. Check referral stats
5. Receive 150 points

**Rewards**:

- Referrer: 150 points
- Referred: 50 points

---

### 🎁 Rewards & Coupons

**URL**: `/customer/rewards`
**URL**: `/customer/coupons`

**Features**:

- ✅ Points-based rewards
- ✅ Coupon management
- ✅ Copy coupon codes
- ✅ Expiry tracking

**Test**:

1. Check points balance
2. Browse rewards catalog
3. Redeem reward
4. View coupons
5. Copy coupon code

---

### 🔍 Search

**URL**: `/customer/search`

**Features**:

- ✅ Real-time search
- ✅ Search history (max 10)
- ✅ Popular searches
- ✅ Product results

**Test**:

1. Type search query
2. See instant results
3. Check search history
4. Try popular searches
5. Clear history

---

### ⚙️ Settings & Profile

**URLs**:

- `/customer/edit-profile`
- `/customer/addresses`
- `/customer/settings`
- `/customer/notifications`

**Features**:

- ✅ Edit profile info
- ✅ Manage addresses
- ✅ Language & theme
- ✅ Notification preferences

**Test**:

1. Update profile
2. Add/edit addresses
3. Change settings
4. View notifications

---

### 📚 Help & Legal

**URLs**:

- `/customer/help`
- `/customer/privacy`
- `/customer/terms`

**Features**:

- ✅ FAQ accordion
- ✅ Contact methods
- ✅ Privacy policy
- ✅ Terms of service

**Test**:

1. Expand FAQ items
2. Read privacy policy
3. Review terms
4. Test contact buttons

---

## 🎨 UI Components Usage

### AchievementToast

```vue
<script setup>
import AchievementToast from "@/components/AchievementToast.vue";
import { ref } from "vue";

const achievement = ref({
  icon: "🏆",
  title: "First Order",
  description: "Complete your first order",
  points: 50,
});
const showToast = ref(false);
</script>

<template>
  <AchievementToast
    :achievement="achievement"
    :show="showToast"
    @close="showToast = false"
  />
</template>
```

### EmptyState

```vue
<template>
  <EmptyState type="cart" @action="router.push('/customer')" />
</template>
```

### PriceDisplay

```vue
<template>
  <PriceDisplay :price="99" :originalPrice="149" size="lg" />
</template>
```

### BadgeComponent

```vue
<template>
  <BadgeComponent variant="success" size="md" rounded> New </BadgeComponent>
</template>
```

---

## 🔧 Composables Usage

### usePullToRefresh

```vue
<script setup>
import { usePullToRefresh } from "@/composables/usePullToRefresh";

const loadData = async () => {
  // Fetch data
};

const { isRefreshing, containerRef } = usePullToRefresh(loadData);
</script>

<template>
  <div ref="containerRef">
    <!-- Content -->
  </div>
</template>
```

### useSearchHistory

```vue
<script setup>
import { useSearchHistory } from "@/composables/useSearchHistory";

const { searchHistory, addToHistory, removeFromHistory, clearHistory } =
  useSearchHistory();

const handleSearch = (term) => {
  addToHistory(term);
  // Perform search
};
</script>
```

### useAchievementTracker

```vue
<script setup>
import { useAchievementTracker } from "@/composables/useAchievementTracker";

const { newAchievement, showToast, trackOrderComplete, closeToast } =
  useAchievementTracker();

// Track when order completes
await trackOrderComplete();
</script>
```

---

## 📊 Database Schema

### user_achievements

```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID (FK to auth.users)
- achievement_id: TEXT
- points: INTEGER
- unlocked_at: TIMESTAMPTZ
```

### referrals

```sql
- id: BIGSERIAL PRIMARY KEY
- referrer_id: UUID (FK to auth.users)
- referred_id: UUID (FK to auth.users)
- referral_code: TEXT
- status: TEXT (pending/completed)
- reward_points: INTEGER
- created_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

### profiles (new columns)

```sql
- referral_code: TEXT UNIQUE
- referred_by: UUID (FK to auth.users)
```

---

## 🎯 Testing Checklist

### Manual Testing

- [ ] Login as user
- [ ] Navigate to profile
- [ ] Test pull-to-refresh
- [ ] View achievements
- [ ] Copy referral code
- [ ] Search products
- [ ] Update profile
- [ ] Manage addresses
- [ ] Change settings
- [ ] View notifications
- [ ] Read help/privacy/terms

### Feature Testing

- [ ] Achievement unlock works
- [ ] Referral tracking works
- [ ] Search history saves
- [ ] Coupons display correctly
- [ ] Rewards redemption works
- [ ] Animations smooth
- [ ] Loading states show
- [ ] Empty states display
- [ ] Error handling works

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (414x896)

---

## 🐛 Troubleshooting

### Issue: Migration fails

**Solution**: Check Supabase connection and run migrations in order

### Issue: Pull-to-refresh not working

**Solution**: Test on actual mobile device, may not work in desktop browser

### Issue: Achievements not unlocking

**Solution**: Ensure migration 018 is run and user is logged in

### Issue: Search history not saving

**Solution**: Check localStorage is enabled in browser

### Issue: Components not rendering

**Solution**: Check console for errors, verify all imports

---

## 📞 Support

If you encounter any issues:

1. Check TEST_CHECKLIST.md for diagnostics
2. Review FEATURES_SUMMARY.md for feature details
3. Check browser console for errors
4. Verify database migration completed

---

## 🎉 Success!

If you can:

- ✅ See profile page with stats
- ✅ Pull down to refresh
- ✅ Navigate to achievements
- ✅ View referral code
- ✅ Search products
- ✅ Update settings

**Congratulations! All 32+ features are working! 🚀**

---

**Created by**: Kiro AI Assistant  
**Date**: 5 January 2026  
**Version**: 1.0.0
