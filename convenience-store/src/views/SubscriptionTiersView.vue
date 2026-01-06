<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Award,
  Medal,
  Crown,
  Gem,
  Check,
  Lock,
  TrendingUp,
} from "lucide-vue-next";
import { useSubscriptionTier } from "../composables/useSubscriptionTier";

const router = useRouter();
const {
  userTier,
  allTiers,
  loading,
  fetchUserTier,
  fetchAllTiers,
  formatSpending,
  getTierBenefits,
} = useSubscriptionTier();

const tierHistory = ref([]);

// Icon components
const iconComponents = {
  award: Award,
  medal: Medal,
  crown: Crown,
  gem: Gem,
};

// Get icon component
const getIcon = (iconName) => iconComponents[iconName] || Award;

// Check if tier is achieved
const isTierAchieved = (tier) => {
  if (!userTier.value) return tier.name === "bronze";
  return (userTier.value.total_spending || 0) >= tier.min_spending;
};

// Check if current tier
const isCurrentTier = (tier) => {
  return userTier.value?.tier_name === tier.name;
};

// Get tier status
const getTierStatus = (tier) => {
  if (isCurrentTier(tier)) return "current";
  if (isTierAchieved(tier)) return "achieved";
  return "locked";
};

// Format date
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

onMounted(async () => {
  await Promise.all([fetchUserTier(), fetchAllTiers()]);
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen pb-24">
    <!-- Header -->
    <div
      class="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-4 flex items-center gap-3 sticky top-0 z-10"
    >
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-white" />
      </button>
      <h1 class="text-lg font-bold text-white">ระดับสมาชิก Subscription</h1>
    </div>

    <!-- Current Tier Summary -->
    <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-4 pb-6">
      <div class="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
          >
            <component
              :is="getIcon(userTier?.icon || 'award')"
              class="w-8 h-8"
            />
          </div>
          <div class="flex-1">
            <p class="text-sm opacity-80">ระดับปัจจุบัน</p>
            <p class="text-2xl font-bold">
              {{ userTier?.display_name || "Bronze" }}
            </p>
            <p class="text-sm opacity-80 mt-1">
              ยอดสะสม {{ formatSpending(userTier?.total_spending || 0) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold">
              +{{ userTier?.discount_bonus || 0 }}%
            </p>
            <p class="text-xs opacity-80">ส่วนลดเพิ่ม</p>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="userTier?.next_tier_name" class="mt-4">
          <div class="flex justify-between text-sm mb-1">
            <span>อัปเกรดเป็น {{ userTier.next_tier_name }}</span>
            <span>{{ userTier.progress_percent?.toFixed(0) || 0 }}%</span>
          </div>
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-white rounded-full transition-all"
              :style="{ width: `${userTier.progress_percent || 0}%` }"
            />
          </div>
          <p class="text-xs opacity-80 mt-1">
            อีก
            {{
              formatSpending(
                (userTier.next_tier_spending || 0) -
                  (userTier.total_spending || 0)
              )
            }}
          </p>
        </div>
        <div v-else class="mt-4 text-center">
          <p class="text-sm opacity-80">🎉 คุณอยู่ระดับสูงสุดแล้ว!</p>
        </div>
      </div>
    </div>

    <!-- All Tiers -->
    <div class="px-4 py-4 space-y-4">
      <h2 class="font-bold text-gray-800">ระดับสมาชิกทั้งหมด</h2>

      <div
        v-for="tier in allTiers"
        :key="tier.id"
        class="bg-white rounded-xl overflow-hidden shadow-sm"
        :class="{
          'ring-2 ring-purple-500': isCurrentTier(tier),
          'opacity-60': getTierStatus(tier) === 'locked',
        }"
      >
        <!-- Tier Header -->
        <div
          class="p-4 flex items-center gap-3"
          :style="{ backgroundColor: tier.color + '20' }"
        >
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: tier.color }"
          >
            <component :is="getIcon(tier.icon)" class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-gray-800">{{ tier.display_name }}</h3>
              <span
                v-if="isCurrentTier(tier)"
                class="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full"
              >
                ระดับปัจจุบัน
              </span>
              <Check
                v-else-if="isTierAchieved(tier)"
                class="w-4 h-4 text-green-500"
              />
              <Lock v-else class="w-4 h-4 text-gray-400" />
            </div>
            <p class="text-sm text-gray-500">
              ยอดสั่งซื้อสะสม {{ formatSpending(tier.min_spending) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold" :style="{ color: tier.color }">
              +{{ tier.discount_bonus }}%
            </p>
            <p class="text-xs text-gray-500">ส่วนลดเพิ่ม</p>
          </div>
        </div>

        <!-- Benefits -->
        <div class="p-4 border-t">
          <p class="text-xs font-medium text-gray-500 mb-2">สิทธิประโยชน์</p>
          <ul class="space-y-1">
            <li
              v-for="(benefit, index) in getTierBenefits(tier)"
              :key="index"
              class="flex items-start gap-2 text-sm text-gray-600"
            >
              <Check class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {{ benefit }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="px-4 pb-4">
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 class="font-bold text-purple-800 mb-2 flex items-center gap-2">
          <TrendingUp class="w-5 h-5" />
          วิธีอัปเกรดระดับ
        </h3>
        <ul class="text-sm text-purple-700 space-y-1">
          <li>• สั่งซื้อผ่านระบบ Subscription อัตโนมัติ</li>
          <li>• ยอดสั่งซื้อจะสะสมอัตโนมัติ</li>
          <li>• เมื่อถึงยอดที่กำหนด ระดับจะอัปเกรดทันที</li>
          <li>• ส่วนลดเพิ่มจะใช้ได้ในออเดอร์ถัดไป</li>
        </ul>
      </div>
    </div>
  </div>
</template>
