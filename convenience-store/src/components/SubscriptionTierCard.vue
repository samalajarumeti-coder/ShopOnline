<script setup>
import { computed, onMounted } from "vue";
import {
  Award,
  Medal,
  Crown,
  Gem,
  ChevronRight,
  TrendingUp,
} from "lucide-vue-next";
import { useSubscriptionTier } from "../composables/useSubscriptionTier";

const {
  userTier,
  allTiers,
  loading,
  tierProgress,
  amountToNextTier,
  fetchUserTier,
  fetchAllTiers,
  getTierColors,
  formatSpending,
  getTierBenefits,
} = useSubscriptionTier();

// Icon components map
const iconComponents = {
  award: Award,
  medal: Medal,
  crown: Crown,
  gem: Gem,
};

const currentIcon = computed(() => {
  const iconName = userTier.value?.icon || "award";
  return iconComponents[iconName] || Award;
});

const tierColorClasses = computed(() => {
  return getTierColors(userTier.value?.tier_name || "bronze");
});

const benefits = computed(() => {
  return getTierBenefits(userTier.value) || [];
});

onMounted(async () => {
  await Promise.all([fetchUserTier(), fetchAllTiers()]);
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <!-- Header with gradient -->
    <div
      class="p-4 text-white bg-gradient-to-r"
      :class="tierColorClasses.gradient"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <component :is="currentIcon" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm opacity-90">ระดับสมาชิก Subscription</p>
            <p class="text-xl font-bold">
              {{ userTier?.display_name || "Bronze" }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm opacity-90">ส่วนลดเพิ่ม</p>
          <p class="text-2xl font-bold">
            +{{ userTier?.discount_bonus || 0 }}%
          </p>
        </div>
      </div>
    </div>

    <!-- Progress to next tier -->
    <div v-if="userTier?.next_tier_name" class="p-4 border-b">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-gray-600">
          <TrendingUp class="w-4 h-4 inline mr-1" />
          อัปเกรดเป็น {{ userTier.next_tier_name }}
        </span>
        <span class="font-medium text-purple-600">
          {{ tierProgress.toFixed(0) }}%
        </span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
          :style="{ width: `${tierProgress}%` }"
        />
      </div>
      <p class="text-xs text-gray-500 mt-2">
        ยอดสั่งซื้ออีก {{ formatSpending(amountToNextTier) }} เพื่ออัปเกรด
      </p>
    </div>

    <!-- Current spending -->
    <div class="p-4 border-b bg-gray-50">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">ยอดสั่งซื้อสะสม</span>
        <span class="font-bold text-gray-800">
          {{ formatSpending(userTier?.total_spending || 0) }}
        </span>
      </div>
    </div>

    <!-- Benefits -->
    <div class="p-4">
      <p class="text-sm font-medium text-gray-700 mb-2">สิทธิประโยชน์ของคุณ</p>
      <ul class="space-y-1.5">
        <li
          v-for="(benefit, index) in benefits"
          :key="index"
          class="flex items-start gap-2 text-sm text-gray-600"
        >
          <span class="text-green-500 mt-0.5">✓</span>
          {{ benefit }}
        </li>
      </ul>
    </div>

    <!-- View all tiers -->
    <router-link
      to="/customer/subscription-tiers"
      class="block p-3 bg-gray-50 text-center text-sm text-purple-600 font-medium hover:bg-gray-100 transition-colors"
    >
      ดูระดับสมาชิกทั้งหมด
      <ChevronRight class="w-4 h-4 inline" />
    </router-link>
  </div>
</template>
