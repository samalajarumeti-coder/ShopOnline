<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import {
  ChevronLeft,
  Gift,
  Star,
  Zap,
  ShoppingBag,
  Coffee,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const userPoints = computed(() => authStore.profile?.points || 0);

const rewards = ref([
  {
    id: 1,
    name: "ส่วนลด 50 บาท",
    description: "ใช้ได้กับการสั่งซื้อครั้งถัดไป",
    points: 500,
    icon: Gift,
    color: "from-blue-500 to-blue-700",
    available: true,
  },
  {
    id: 2,
    name: "ส่วนลด 100 บาท",
    description: "ใช้ได้กับการสั่งซื้อครั้งถัดไป",
    points: 1000,
    icon: Star,
    color: "from-purple-500 to-purple-700",
    available: true,
  },
  {
    id: 3,
    name: "ส่วนลด 200 บาท",
    description: "ใช้ได้กับการสั่งซื้อครั้งถัดไป",
    points: 2000,
    icon: Zap,
    color: "from-orange-500 to-red-600",
    available: true,
  },
  {
    id: 4,
    name: "ฟรี! กาแฟ 1 แก้ว",
    description: "แลกรับกาแฟฟรี 1 แก้ว",
    points: 300,
    icon: Coffee,
    color: "from-amber-600 to-amber-800",
    available: true,
  },
  {
    id: 5,
    name: "ฟรีค่าจัดส่ง",
    description: "ใช้ได้ 1 ครั้ง",
    points: 200,
    icon: ShoppingBag,
    color: "from-green-500 to-green-700",
    available: true,
  },
  {
    id: 6,
    name: "ส่วนลด 500 บาท",
    description: "ใช้ได้กับการสั่งซื้อครั้งถัดไป",
    points: 5000,
    icon: Star,
    color: "from-pink-500 to-rose-600",
    available: true,
  },
]);

const canRedeem = (points) => {
  return userPoints.value >= points;
};

const redeemReward = (reward) => {
  if (!canRedeem(reward.points)) {
    alert(`คุณต้องมีคะแนนอย่างน้อย ${reward.points} คะแนน`);
    return;
  }

  if (
    confirm(`ต้องการแลก ${reward.name} ใช่หรือไม่?\nใช้ ${reward.points} คะแนน`)
  ) {
    // TODO: Implement reward redemption
    alert("แลกของรางวัลสำเร็จ!");
  }
};
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
        <h1 class="text-lg font-semibold text-gray-900">แลกของรางวัล</h1>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Points Card -->
      <div
        class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Star class="w-8 h-8 fill-yellow-300 text-yellow-300" />
          </div>
          <div>
            <p class="text-sm opacity-90 mb-1">คะแนนของคุณ</p>
            <p class="text-3xl font-bold">{{ userPoints }}</p>
          </div>
        </div>
        <div class="bg-white/20 backdrop-blur-sm rounded-xl p-3">
          <p class="text-sm opacity-90 mb-1">วิธีรับคะแนน</p>
          <ul class="text-xs space-y-1 opacity-90">
            <li>• สั่งซื้อสินค้า รับ 1 คะแนนต่อ 10 บาท</li>
            <li>• ปลดล็อกความสำเร็จ</li>
            <li>• แนะนำเพื่อน</li>
          </ul>
        </div>
      </div>

      <!-- Rewards Grid -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-500 px-2">
          ของรางวัลทั้งหมด
        </h3>
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="reward in rewards"
            :key="reward.id"
            class="bg-white rounded-xl overflow-hidden shadow-sm"
            :class="{ 'opacity-60': !canRedeem(reward.points) }"
          >
            <div class="flex items-center gap-4 p-4">
              <!-- Icon -->
              <div
                class="w-16 h-16 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br"
                :class="reward.color"
              >
                <component :is="reward.icon" class="w-8 h-8" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-900 mb-1">{{ reward.name }}</h4>
                <p class="text-sm text-gray-600 mb-2">
                  {{ reward.description }}
                </p>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 text-xs font-medium text-[#007f3e] bg-green-50 px-2 py-1 rounded"
                  >
                    <Star class="w-3 h-3" />
                    {{ reward.points }} คะแนน
                  </span>
                  <span
                    v-if="!canRedeem(reward.points)"
                    class="text-xs text-red-500"
                  >
                    ต้องการอีก {{ reward.points - userPoints }} คะแนน
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <button
                @click="redeemReward(reward)"
                :disabled="!canRedeem(reward.points)"
                class="px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                :class="
                  canRedeem(reward.points)
                    ? 'bg-[#007f3e] text-white hover:bg-[#006633]'
                    : ''
                "
              >
                แลก
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- How to Earn More -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3">วิธีรับคะแนนเพิ่ม</h3>
        <div class="space-y-3">
          <button
            @click="router.push('/customer')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
              >
                <ShoppingBag class="w-5 h-5 text-blue-600" />
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">สั่งซื้อสินค้า</p>
                <p class="text-xs text-gray-500">รับ 1 คะแนนต่อ 10 บาท</p>
              </div>
            </div>
            <ChevronLeft class="w-5 h-5 text-gray-400 rotate-180" />
          </button>

          <button
            @click="router.push('/customer/achievements')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
              >
                <Star class="w-5 h-5 text-purple-600" />
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">ปลดล็อกความสำเร็จ</p>
                <p class="text-xs text-gray-500">รับคะแนนพิเศษ</p>
              </div>
            </div>
            <ChevronLeft class="w-5 h-5 text-gray-400 rotate-180" />
          </button>

          <button
            @click="router.push('/customer/referral')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"
              >
                <Gift class="w-5 h-5 text-orange-600" />
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">แนะนำเพื่อน</p>
                <p class="text-xs text-gray-500">รับ 150 คะแนนต่อคน</p>
              </div>
            </div>
            <ChevronLeft class="w-5 h-5 text-gray-400 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
