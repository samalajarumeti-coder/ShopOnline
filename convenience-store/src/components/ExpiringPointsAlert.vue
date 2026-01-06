<template>
  <div v-if="hasExpiringPoints" class="expiring-points-alert">
    <!-- Urgent Alert (within 7 days) -->
    <div
      v-if="hasUrgentPoints"
      class="bg-red-50 border-l-4 border-red-500 p-4 mb-4"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-2xl">⚠️</span>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-bold text-red-800">คะแนนใกล้หมดอายุ!</h3>
          <p class="text-sm text-red-700 mt-1">
            คุณมีคะแนน
            <span class="font-bold">{{
              totalUrgentPoints.toLocaleString()
            }}</span>
            ที่จะหมดอายุภายใน 7 วัน
          </p>
          <button
            @click="showDetails = !showDetails"
            class="text-sm text-red-800 font-medium mt-2 hover:text-red-900"
          >
            {{ showDetails ? "ซ่อนรายละเอียด" : "ดูรายละเอียด" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Warning Alert (8-30 days) -->
    <div v-else class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-2xl">💡</span>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-bold text-yellow-800">แจ้งเตือนคะแนน</h3>
          <p class="text-sm text-yellow-700 mt-1">
            คุณมีคะแนน
            <span class="font-bold">{{
              totalExpiringPoints.toLocaleString()
            }}</span>
            ที่จะหมดอายุภายใน 30 วัน
          </p>
          <button
            @click="showDetails = !showDetails"
            class="text-sm text-yellow-800 font-medium mt-2 hover:text-yellow-900"
          >
            {{ showDetails ? "ซ่อนรายละเอียด" : "ดูรายละเอียด" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Details -->
    <div v-if="showDetails" class="bg-white rounded-lg shadow p-4 mb-4">
      <h4 class="font-bold text-gray-900 mb-3">รายละเอียดคะแนนที่จะหมดอายุ</h4>

      <!-- Urgent (7 days) -->
      <div v-if="groupedByUrgency.urgent.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-red-600 font-medium text-sm"
            >🔴 ด่วนมาก (≤ 7 วัน)</span
          >
        </div>
        <div class="space-y-2">
          <div
            v-for="(item, index) in groupedByUrgency.urgent"
            :key="index"
            class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
          >
            <div>
              <div class="font-bold text-red-900">
                {{ item.points.toLocaleString() }} คะแนน
              </div>
              <div class="text-xs text-red-700">
                หมดอายุ: {{ formatExpiryDate(item.expires_at) }}
              </div>
            </div>
            <div class="text-right">
              <div
                :class="getUrgencyBadgeColor(item.days_remaining)"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                อีก {{ item.days_remaining }} วัน
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning (8-14 days) -->
      <div v-if="groupedByUrgency.warning.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-orange-600 font-medium text-sm"
            >🟠 เร็วๆ นี้ (8-14 วัน)</span
          >
        </div>
        <div class="space-y-2">
          <div
            v-for="(item, index) in groupedByUrgency.warning"
            :key="index"
            class="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
          >
            <div>
              <div class="font-bold text-orange-900">
                {{ item.points.toLocaleString() }} คะแนน
              </div>
              <div class="text-xs text-orange-700">
                หมดอายุ: {{ formatExpiryDate(item.expires_at) }}
              </div>
            </div>
            <div class="text-right">
              <div
                :class="getUrgencyBadgeColor(item.days_remaining)"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                อีก {{ item.days_remaining }} วัน
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Normal (15-30 days) -->
      <div v-if="groupedByUrgency.normal.length > 0">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-yellow-600 font-medium text-sm"
            >🟡 ปกติ (15-30 วัน)</span
          >
        </div>
        <div class="space-y-2">
          <div
            v-for="(item, index) in groupedByUrgency.normal"
            :key="index"
            class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
          >
            <div>
              <div class="font-bold text-yellow-900">
                {{ item.points.toLocaleString() }} คะแนน
              </div>
              <div class="text-xs text-yellow-700">
                หมดอายุ: {{ formatExpiryDate(item.expires_at) }}
              </div>
            </div>
            <div class="text-right">
              <div
                :class="getUrgencyBadgeColor(item.days_remaining)"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                อีก {{ item.days_remaining }} วัน
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="mt-4 pt-4 border-t">
        <router-link
          to="/customer/loyalty?tab=rewards"
          class="block w-full bg-purple-600 text-white text-center py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          แลกรางวัลเลย
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePointsExpiration } from "../composables/usePointsExpiration";

const {
  hasExpiringPoints,
  hasUrgentPoints,
  totalExpiringPoints,
  totalUrgentPoints,
  groupedByUrgency,
  fetchExpiringPoints,
  formatExpiryDate,
  getUrgencyBadgeColor,
} = usePointsExpiration();

const showDetails = ref(false);

onMounted(() => {
  fetchExpiringPoints(30);
});
</script>
