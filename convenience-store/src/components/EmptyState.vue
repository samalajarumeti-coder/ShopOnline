<script setup>
import { computed } from "vue";
import {
  ShoppingCart,
  Package,
  Heart,
  Search,
  Inbox,
  AlertCircle,
} from "lucide-vue-next";

const props = defineProps({
  type: {
    type: String,
    default: "default",
    validator: (value) =>
      [
        "cart",
        "orders",
        "wishlist",
        "search",
        "notifications",
        "error",
        "default",
      ].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  actionText: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["action"]);

const config = computed(() => {
  const configs = {
    cart: {
      icon: ShoppingCart,
      title: "ตะกร้าสินค้าว่างเปล่า",
      description: "เพิ่มสินค้าที่คุณชอบลงในตะกร้า",
      actionText: "เริ่มช้อปปิ้ง",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    orders: {
      icon: Package,
      title: "ยังไม่มีคำสั่งซื้อ",
      description: "เมื่อคุณสั่งซื้อสินค้า จะแสดงที่นี่",
      actionText: "เริ่มช้อปปิ้ง",
      iconColor: "text-green-500",
      bgColor: "bg-green-100",
    },
    wishlist: {
      icon: Heart,
      title: "ยังไม่มีรายการโปรด",
      description: "เพิ่มสินค้าที่คุณชอบเพื่อดูภายหลัง",
      actionText: "ค้นหาสินค้า",
      iconColor: "text-red-500",
      bgColor: "bg-red-100",
    },
    search: {
      icon: Search,
      title: "ไม่พบสินค้า",
      description: "ลองค้นหาด้วยคำอื่นหรือดูสินค้ายอดนิยม",
      actionText: "ดูสินค้าทั้งหมด",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    notifications: {
      icon: Inbox,
      title: "ไม่มีการแจ้งเตือน",
      description:
        "คุณจะได้รับการแจ้งเตือนเกี่ยวกับคำสั่งซื้อและโปรโมชั่นที่นี่",
      actionText: "",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-100",
    },
    error: {
      icon: AlertCircle,
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
      actionText: "ลองอีกครั้ง",
      iconColor: "text-red-500",
      bgColor: "bg-red-100",
    },
    default: {
      icon: Inbox,
      title: "ไม่มีข้อมูล",
      description: "ยังไม่มีข้อมูลที่จะแสดง",
      actionText: "",
      iconColor: "text-gray-500",
      bgColor: "bg-gray-100",
    },
  };

  return configs[props.type] || configs.default;
});

const displayTitle = computed(() => props.title || config.value.title);
const displayDescription = computed(
  () => props.description || config.value.description
);
const displayActionText = computed(
  () => props.actionText || config.value.actionText
);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <!-- Icon -->
    <div
      class="w-24 h-24 rounded-full flex items-center justify-center mb-4"
      :class="config.bgColor"
    >
      <component
        :is="config.icon"
        class="w-12 h-12"
        :class="config.iconColor"
      />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {{ displayTitle }}
    </h3>

    <!-- Description -->
    <p class="text-gray-500 mb-6 max-w-sm">
      {{ displayDescription }}
    </p>

    <!-- Action Button -->
    <button
      v-if="displayActionText"
      @click="emit('action')"
      class="bg-[#007f3e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
    >
      {{ displayActionText }}
    </button>

    <!-- Slot for custom content -->
    <slot></slot>
  </div>
</template>
