<script setup>
import { useRouter } from "vue-router";
import { Scan, Ticket, Gift, Zap, Percent, Bell } from "lucide-vue-next";

const router = useRouter();

const actions = [
  {
    icon: Scan,
    label: "สแกน QR",
    color: "from-blue-500 to-blue-700",
    path: "/customer/scan",
  },
  {
    icon: Ticket,
    label: "คูปอง",
    color: "from-orange-500 to-red-600",
    path: "/customer/coupons",
  },
  {
    icon: Gift,
    label: "รางวัล",
    color: "from-purple-500 to-purple-700",
    path: "/customer/rewards",
  },
  {
    icon: Zap,
    label: "Flash Sale",
    color: "from-yellow-500 to-orange-600",
    path: "/customer/promotions",
  },
  {
    icon: Percent,
    label: "โปรโมชั่น",
    color: "from-green-500 to-green-700",
    path: "/customer/promotions",
  },
  {
    icon: Bell,
    label: "แจ้งเตือน",
    color: "from-pink-500 to-rose-600",
    path: "/customer/notifications",
  },
];
</script>

<template>
  <div class="bg-white rounded-xl p-4 shadow-sm">
    <div class="grid grid-cols-3 gap-4">
      <button
        v-for="action in actions"
        :key="action.label"
        @click="router.push(action.path)"
        class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors touch-feedback"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br"
          :class="action.color"
        >
          <component :is="action.icon" class="w-6 h-6" />
        </div>
        <span class="text-xs font-medium text-gray-700 text-center">
          {{ action.label }}
        </span>
      </button>
    </div>
  </div>
</template>
