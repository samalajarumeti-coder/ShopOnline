<template>
  <div class="loyalty-view pb-20">
    <!-- Header -->
    <div class="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6">
      <h1 class="text-2xl font-bold mb-2">โปรแกรมสะสมคะแนน</h1>
      <p class="text-purple-100">สะสมคะแนนทุกการซื้อ แลกของรางวัลมากมาย</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6 text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"
      ></div>
    </div>

    <div v-else>
      <!-- Expiring Points Alert -->
      <div class="p-4">
        <ExpiringPointsAlert />
      </div>

      <!-- Points Card -->
      <div class="p-4">
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm text-gray-600">คะแนนที่ใช้ได้</div>
              <div class="text-4xl font-bold text-purple-600">
                {{ userLoyalty?.available_points?.toLocaleString() || 0 }}
              </div>
            </div>
            <div class="text-right">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                :style="{
                  backgroundColor: userLoyalty?.tier?.badge_color || '#94a3b8',
                }"
              >
                {{ userLoyalty?.tier?.badge_icon || "🏅" }}
              </div>
              <div class="text-xs font-medium mt-1">
                {{ userLoyalty?.tier?.name || "Member" }}
              </div>
            </div>
          </div>

          <!-- Tier Progress -->
          <div v-if="nextTier" class="mt-4">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-600"
                >ความคืบหน้าไปยัง {{ nextTier.name }}</span
              >
              <span class="font-medium">{{ Math.round(tierProgress) }}%</span>
            </div>
            <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                :style="{ width: tierProgress + '%' }"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              อีก {{ pointsToNextTier.toLocaleString() }} คะแนนเพื่ออัพเกรด
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ userLoyalty?.lifetime_points?.toLocaleString() || 0 }}
              </div>
              <div class="text-xs text-gray-600">คะแนนสะสม</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ userLoyalty?.current_streak || 0 }}
              </div>
              <div class="text-xs text-gray-600">ซื้อติดต่อกัน</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ activeUserRewards.length }}
              </div>
              <div class="text-xs text-gray-600">รางวัลที่มี</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b bg-white sticky top-0 z-10 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="
            activeTab === tab.id
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600'
          "
          class="flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Rewards Tab -->
      <div v-show="activeTab === 'rewards'" class="p-4 space-y-3">
        <div
          v-if="affordableRewards.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <div class="text-4xl mb-2">🎁</div>
          <div>ยังไม่มีรางวัลที่แลกได้</div>
          <div class="text-sm">สะสมคะแนนเพิ่มเพื่อแลกของรางวัล</div>
        </div>

        <div
          v-for="reward in rewards"
          :key="reward.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex gap-4">
            <div
              class="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-3xl"
            >
              🎁
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-900">{{ reward.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ reward.description }}</p>
              <div class="flex items-center justify-between mt-3">
                <div class="text-lg font-bold text-purple-600">
                  {{ reward.points_cost.toLocaleString() }} คะแนน
                </div>
                <button
                  @click="handleRedeem(reward)"
                  :disabled="!canAfford(reward)"
                  :class="
                    canAfford(reward)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  "
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  แลก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Challenges Tab -->
      <div v-show="activeTab === 'challenges'" class="p-4 space-y-3">
        <div
          v-for="challenge in challengesWithProgress"
          :key="challenge.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-bold text-gray-900">{{ challenge.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                {{ challenge.description }}
              </p>
            </div>
            <div class="text-right ml-4">
              <div class="text-lg font-bold text-purple-600">
                +{{ challenge.reward_points }}
              </div>
              <div class="text-xs text-gray-500">คะแนน</div>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-600">
              {{ challenge.progress?.current_value || 0 }} /
              {{ challenge.target_value }}
            </span>
            <span class="font-medium"
              >{{ Math.round(challenge.percentage) }}%</span
            >
          </div>
          <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              :style="{ width: challenge.percentage + '%' }"
            ></div>
          </div>

          <div
            v-if="challenge.isCompleted"
            class="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium"
          >
            <span>✓</span>
            <span>ทำสำเร็จแล้ว!</span>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-show="activeTab === 'history'" class="p-4 space-y-3">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ tx.description }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ formatDate(tx.created_at) }}
              </div>
            </div>
            <div
              :class="tx.points > 0 ? 'text-green-600' : 'text-red-600'"
              class="text-lg font-bold"
            >
              {{ tx.points > 0 ? "+" : "" }}{{ tx.points }}
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboard Tab -->
      <div v-show="activeTab === 'leaderboard'">
        <LeaderboardView />
      </div>

      <!-- My Rewards Tab -->
      <div v-show="activeTab === 'my-rewards'" class="p-4 space-y-3">
        <div
          v-if="activeUserRewards.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <div class="text-4xl mb-2">🎫</div>
          <div>ยังไม่มีรางวัลที่แลกไว้</div>
        </div>

        <div
          v-for="userReward in userRewards"
          :key="userReward.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h3 class="font-bold text-gray-900">
                {{ userReward.reward?.name }}
              </h3>
              <div class="text-sm text-gray-600 mt-1">
                {{ userReward.reward?.description }}
              </div>
            </div>
            <span
              :class="getStatusClass(userReward.status)"
              class="px-2 py-1 text-xs rounded-full"
            >
              {{ getStatusLabel(userReward.status) }}
            </span>
          </div>

          <div class="bg-gray-50 rounded p-3 mt-3">
            <div class="text-xs text-gray-600 mb-1">รหัสรางวัล</div>
            <div class="font-mono font-bold text-lg">{{ userReward.code }}</div>
          </div>

          <div
            class="flex items-center justify-between text-xs text-gray-500 mt-3"
          >
            <span>แลกเมื่อ: {{ formatDate(userReward.redeemed_at) }}</span>
            <span>หมดอายุ: {{ formatDate(userReward.expires_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useLoyalty } from "../composables/useLoyalty";
import ExpiringPointsAlert from "../components/ExpiringPointsAlert.vue";
import LeaderboardView from "../components/LeaderboardView.vue";

const {
  userLoyalty,
  rewards,
  transactions,
  userRewards,
  nextTier,
  tierProgress,
  pointsToNextTier,
  affordableRewards,
  activeUserRewards,
  challengesWithProgress,
  loading,
  fetchUserLoyalty,
  fetchTiers,
  fetchRewards,
  fetchTransactions,
  fetchUserRewards,
  fetchChallenges,
  fetchChallengeProgress,
  redeemReward,
} = useLoyalty();

const activeTab = ref("rewards");
const tabs = [
  { id: "rewards", label: "รางวัล" },
  { id: "challenges", label: "ภารกิจ" },
  { id: "leaderboard", label: "อันดับ" },
  { id: "my-rewards", label: "รางวัลของฉัน" },
  { id: "history", label: "ประวัติ" },
];

const canAfford = (reward) => {
  if (!userLoyalty.value) return false;
  return (
    reward.points_cost <= userLoyalty.value.available_points &&
    (reward.min_tier_level || 1) <= (userLoyalty.value.tier?.level || 1)
  );
};

const handleRedeem = async (reward) => {
  if (!canAfford(reward)) return;

  if (
    !confirm(
      `ต้องการแลก ${reward.name} ใช้ ${reward.points_cost} คะแนนใช่หรือไม่?`
    )
  ) {
    return;
  }

  try {
    await redeemReward(reward.id);
    alert('แลกรางวัลสำเร็จ! ตรวจสอบได้ที่แท็บ "รางวัลของฉัน"');
    activeTab.value = "my-rewards";
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status) => {
  const labels = {
    active: "ใช้ได้",
    used: "ใช้แล้ว",
    expired: "หมดอายุ",
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    active: "bg-green-100 text-green-800",
    used: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
};

onMounted(async () => {
  await Promise.all([
    fetchUserLoyalty(),
    fetchTiers(),
    fetchRewards(),
    fetchTransactions(50),
    fetchUserRewards(),
    fetchChallenges(),
    fetchChallengeProgress(),
  ]);
});
</script>
