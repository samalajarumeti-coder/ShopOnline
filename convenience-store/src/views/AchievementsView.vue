<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAchievementsStore } from "../stores/achievements";
import {
  ChevronLeft,
  Trophy,
  Lock,
  CheckCircle,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const achievementsStore = useAchievementsStore();

const categorizedAchievements = computed(() => {
  const categories = {
    orders: { title: "การสั่งซื้อ", achievements: [] },
    spending: { title: "การใช้จ่าย", achievements: [] },
    social: { title: "โซเชียล", achievements: [] },
    special: { title: "พิเศษ", achievements: [] },
  };

  achievementsStore.allAchievements.forEach((achievement) => {
    if (achievement.id.includes("order")) {
      categories.orders.achievements.push(achievement);
    } else if (achievement.id.includes("spend")) {
      categories.spending.achievements.push(achievement);
    } else if (
      achievement.id.includes("referral") ||
      achievement.id.includes("review")
    ) {
      categories.social.achievements.push(achievement);
    } else {
      categories.special.achievements.push(achievement);
    }
  });

  return categories;
});

onMounted(() => {
  achievementsStore.fetchUserAchievements();
});
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center gap-3 px-4 py-4">
        <button
          @click="router.back()"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft class="w-6 h-6 text-gray-700" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900">ความสำเร็จ</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="achievementsStore.loading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
    </div>

    <div v-else>
      <!-- Stats Card -->
      <div class="p-4">
        <div
          class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Trophy class="w-8 h-8" />
            </div>
            <div>
              <h2 class="text-2xl font-bold">
                {{ achievementsStore.unlockedCount }}/{{
                  achievementsStore.allAchievements.length
                }}
              </h2>
              <p class="text-sm opacity-90">ความสำเร็จที่ปลดล็อก</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-3">
            <div class="flex justify-between text-sm mb-1">
              <span>ความคืบหน้า</span>
              <span>{{ achievementsStore.progress }}%</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2">
              <div
                class="bg-white rounded-full h-2 transition-all duration-500"
                :style="{ width: `${achievementsStore.progress}%` }"
              ></div>
            </div>
          </div>

          <!-- Total Points -->
          <div
            class="flex items-center justify-between pt-3 border-t border-white/20"
          >
            <span class="text-sm opacity-90">คะแนนรวมจากความสำเร็จ</span>
            <span class="text-xl font-bold">{{
              achievementsStore.totalPoints
            }}</span>
          </div>
        </div>
      </div>

      <!-- Achievements by Category -->
      <div class="px-4 pb-4 space-y-4">
        <div
          v-for="(category, key) in categorizedAchievements"
          :key="key"
          class="space-y-2"
        >
          <h3 class="text-sm font-semibold text-gray-500 px-2">
            {{ category.title }}
          </h3>

          <div class="space-y-2">
            <div
              v-for="achievement in category.achievements"
              :key="achievement.id"
              class="bg-white rounded-xl p-4 shadow-sm"
              :class="{
                'opacity-60': !achievementsStore.isUnlocked(achievement.id),
              }"
            >
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  :class="
                    achievementsStore.isUnlocked(achievement.id)
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gray-200'
                  "
                >
                  <span v-if="achievementsStore.isUnlocked(achievement.id)">
                    {{ achievement.icon }}
                  </span>
                  <Lock v-else class="w-6 h-6 text-gray-400" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="font-semibold text-gray-900">
                      {{ achievement.title }}
                    </h4>
                    <CheckCircle
                      v-if="achievementsStore.isUnlocked(achievement.id)"
                      class="w-5 h-5 text-green-500 flex-shrink-0"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mb-2">
                    {{ achievement.description }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-[#007f3e] bg-green-50 px-2 py-1 rounded"
                    >
                      +{{ achievement.points }} คะแนน
                    </span>
                    <span
                      v-if="achievementsStore.isUnlocked(achievement.id)"
                      class="text-xs text-gray-500"
                    >
                      ปลดล็อกแล้ว
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
