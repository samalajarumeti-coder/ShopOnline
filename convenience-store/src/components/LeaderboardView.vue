<template>
  <div class="leaderboard-view">
    <!-- Header -->
    <div
      class="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 text-white p-6 rounded-t-2xl"
    >
      <h2 class="text-2xl font-bold mb-2">🏆 Leaderboard</h2>
      <p class="text-yellow-100">แข่งขันสะสมคะแนนและชิงรางวัล!</p>
    </div>

    <!-- Period Selector -->
    <div class="bg-white border-b sticky top-0 z-10">
      <div class="flex overflow-x-auto">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="
            selectedPeriod === period.value
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          "
          class="flex-1 min-w-[100px] py-3 px-4 text-sm font-medium transition-colors"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"
      ></div>
    </div>

    <div v-else class="p-4">
      <!-- My Rank Card -->
      <div
        v-if="myPosition"
        class="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-4 mb-4 shadow-lg"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm opacity-90">อันดับของคุณ</div>
            <div class="text-4xl font-bold mt-1">
              {{ getRankBadge(myPosition.rank) }} #{{ myPosition.rank }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm opacity-90">คะแนนรวม</div>
            <div class="text-2xl font-bold mt-1">
              {{ myPosition.total_score.toLocaleString() }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
          <div class="text-center">
            <div class="text-xs opacity-75">คะแนนที่ได้</div>
            <div class="font-bold">
              {{ myPosition.points_earned.toLocaleString() }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs opacity-75">ภารกิจ</div>
            <div class="font-bold">{{ myPosition.challenges_completed }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs opacity-75">แนะนำเพื่อน</div>
            <div class="font-bold">{{ myPosition.referrals_completed }}</div>
          </div>
        </div>

        <!-- Reward Info -->
        <div
          v-if="myPosition.reward"
          class="mt-4 pt-4 border-t border-white/20"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm">
              <span class="opacity-75">รางวัล:</span>
              <span class="font-bold ml-1">{{
                myPosition.reward.reward_description
              }}</span>
            </div>
            <div class="text-lg font-bold">
              +{{ myPosition.reward.reward_points }} คะแนน
            </div>
          </div>
        </div>
      </div>

      <!-- Rewards Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 class="font-bold text-blue-900 mb-2">
          🎁 รางวัลประจำ{{ formatPeriodLabel(selectedPeriod) }}
        </h3>
        <div class="space-y-2">
          <div
            v-for="reward in leaderboardRewards"
            :key="reward.id"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ reward.reward_badge }}</span>
              <span class="text-gray-700">
                อันดับ {{ reward.rank_from
                }}{{
                  reward.rank_from !== reward.rank_to
                    ? `-${reward.rank_to}`
                    : ""
                }}
              </span>
            </div>
            <span class="font-bold text-blue-600"
              >+{{ reward.reward_points }} คะแนน</span
            >
          </div>
        </div>
      </div>

      <!-- Top 3 Podium -->
      <div v-if="topThree.length >= 3" class="mb-6">
        <div class="flex items-end justify-center gap-2 mb-4">
          <!-- 2nd Place -->
          <div class="flex-1 text-center">
            <div
              class="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg p-4 h-32 flex flex-col justify-end"
            >
              <div class="text-3xl mb-2">🥈</div>
              <div class="font-bold text-white text-sm truncate">
                {{ topThree[1]?.user?.full_name || "User" }}
              </div>
              <div class="text-white text-xs mt-1">
                {{ topThree[1]?.total_score.toLocaleString() }}
              </div>
            </div>
            <div class="bg-gray-400 text-white font-bold py-2 text-lg">#2</div>
          </div>

          <!-- 1st Place -->
          <div class="flex-1 text-center">
            <div
              class="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg p-4 h-40 flex flex-col justify-end"
            >
              <div class="text-4xl mb-2">🥇</div>
              <div class="font-bold text-white truncate">
                {{ topThree[0]?.user?.full_name || "User" }}
              </div>
              <div class="text-white text-xs mt-1">
                {{ topThree[0]?.total_score.toLocaleString() }}
              </div>
            </div>
            <div class="bg-yellow-500 text-white font-bold py-2 text-xl">
              #1
            </div>
          </div>

          <!-- 3rd Place -->
          <div class="flex-1 text-center">
            <div
              class="bg-gradient-to-b from-orange-300 to-orange-500 rounded-t-lg p-4 h-24 flex flex-col justify-end"
            >
              <div class="text-2xl mb-2">🥉</div>
              <div class="font-bold text-white text-sm truncate">
                {{ topThree[2]?.user?.full_name || "User" }}
              </div>
              <div class="text-white text-xs mt-1">
                {{ topThree[2]?.total_score.toLocaleString() }}
              </div>
            </div>
            <div class="bg-orange-500 text-white font-bold py-2">#3</div>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b">
          <h3 class="font-bold text-gray-900">อันดับทั้งหมด</h3>
        </div>
        <div class="divide-y">
          <div
            v-for="entry in leaderboard"
            :key="entry.id"
            :class="
              entry.user_id === authStore.user?.id ? 'bg-purple-50' : 'bg-white'
            "
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <!-- Rank -->
              <div class="w-12 text-center">
                <div
                  :class="getRankColor(entry.rank)"
                  class="text-2xl font-bold"
                >
                  {{ getRankBadge(entry.rank) }}
                </div>
                <div class="text-xs text-gray-600 font-medium">
                  #{{ entry.rank }}
                </div>
              </div>

              <!-- User Info -->
              <div class="flex-1">
                <div class="font-bold text-gray-900">
                  {{ entry.user?.full_name || "User" }}
                  <span
                    v-if="entry.user_id === authStore.user?.id"
                    class="text-purple-600 text-sm ml-1"
                    >(คุณ)</span
                  >
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-600 mt-1">
                  <span>💰 {{ entry.points_earned.toLocaleString() }}</span>
                  <span>✅ {{ entry.challenges_completed }}</span>
                  <span>👥 {{ entry.referrals_completed }}</span>
                </div>
              </div>

              <!-- Total Score -->
              <div class="text-right">
                <div class="text-lg font-bold text-purple-600">
                  {{ entry.total_score.toLocaleString() }}
                </div>
                <div class="text-xs text-gray-500">คะแนนรวม</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="leaderboard.length === 0"
        class="text-center py-12 text-gray-500"
      >
        <div class="text-4xl mb-2">🏆</div>
        <div>ยังไม่มีข้อมูล Leaderboard</div>
        <div class="text-sm">เริ่มสะสมคะแนนเพื่อขึ้นอันดับ!</div>
      </div>

      <!-- How Scoring Works -->
      <div class="bg-gray-50 rounded-lg p-4 mt-4">
        <h3 class="font-bold text-gray-900 mb-3">📊 วิธีคำนวณคะแนน</h3>
        <div class="space-y-2 text-sm text-gray-700">
          <div class="flex items-center justify-between">
            <span>คะแนนที่ได้รับ</span>
            <span class="font-medium">= คะแนนจริง</span>
          </div>
          <div class="flex items-center justify-between">
            <span>ภารกิจที่ทำสำเร็จ</span>
            <span class="font-medium">× 50 คะแนน</span>
          </div>
          <div class="flex items-center justify-between">
            <span>แนะนำเพื่อนสำเร็จ</span>
            <span class="font-medium">× 100 คะแนน</span>
          </div>
          <div
            class="pt-2 border-t font-bold flex items-center justify-between"
          >
            <span>คะแนนรวม</span>
            <span class="text-purple-600">= ผลรวมทั้งหมด</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useLeaderboard } from "../composables/useLeaderboard";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();

const {
  leaderboard,
  myPosition,
  leaderboardRewards,
  topThree,
  loading,
  fetchLeaderboard,
  fetchLeaderboardRewards,
  formatPeriodLabel,
  getRankBadge,
  getRankColor,
} = useLeaderboard();

const selectedPeriod = ref("monthly");
const periods = [
  { value: "daily", label: "วันนี้" },
  { value: "weekly", label: "สัปดาห์นี้" },
  { value: "monthly", label: "เดือนนี้" },
  { value: "all_time", label: "ตลอดกาล" },
];

watch(selectedPeriod, async (newPeriod) => {
  await fetchLeaderboard(newPeriod);
  await fetchLeaderboardRewards(newPeriod);
});

onMounted(async () => {
  await fetchLeaderboard(selectedPeriod.value);
  await fetchLeaderboardRewards(selectedPeriod.value);
});
</script>
