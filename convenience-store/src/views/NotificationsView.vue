<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ChevronLeft,
  Bell,
  Package,
  Gift,
  Megaphone,
  Settings,
} from "lucide-vue-next";

const router = useRouter();

const notifications = ref([
  {
    id: 1,
    type: "order",
    icon: Package,
    title: "คำสั่งซื้อของคุณกำลังจัดส่ง",
    message: "คำสั่งซื้อ #12345 กำลังอยู่ระหว่างการจัดส่ง",
    time: "5 นาทีที่แล้ว",
    read: false,
  },
  {
    id: 2,
    type: "promotion",
    icon: Megaphone,
    title: "โปรโมชั่นพิเศษ!",
    message: "ลดสูงสุด 50% สำหรับสินค้าหมวดเครื่องดื่ม",
    time: "2 ชั่วโมงที่แล้ว",
    read: false,
  },
  {
    id: 3,
    type: "coupon",
    icon: Gift,
    title: "คูปองใหม่สำหรับคุณ",
    message: "รับคูปองส่วนลด 100 บาท เมื่อซื้อครบ 500 บาท",
    time: "1 วันที่แล้ว",
    read: true,
  },
  {
    id: 4,
    type: "order",
    icon: Package,
    title: "คำสั่งซื้อสำเร็จ",
    message: "คำสั่งซื้อ #12344 ได้รับสินค้าเรียบร้อยแล้ว",
    time: "2 วันที่แล้ว",
    read: true,
  },
]);

const unreadCount = ref(notifications.value.filter((n) => !n.read).length);

const markAsRead = (id) => {
  const notification = notifications.value.find((n) => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    unreadCount.value--;
  }
};

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.read = true));
  unreadCount.value = 0;
};

const getTypeColor = (type) => {
  const colors = {
    order: "bg-blue-100 text-blue-600",
    promotion: "bg-orange-100 text-orange-600",
    coupon: "bg-green-100 text-green-600",
  };
  return colors[type] || "bg-gray-100 text-gray-600";
};
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3">
          <button
            @click="router.back()"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft class="w-6 h-6 text-gray-700" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900">การแจ้งเตือน</h1>
          <span
            v-if="unreadCount > 0"
            class="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {{ unreadCount }}
          </span>
        </div>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-sm text-[#007f3e] font-medium hover:underline"
        >
          อ่านทั้งหมด
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="notifications.length === 0"
      class="flex flex-col items-center justify-center py-20 px-4"
    >
      <div
        class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <Bell class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        ไม่มีการแจ้งเตือน
      </h3>
      <p class="text-gray-500 text-center">
        คุณจะได้รับการแจ้งเตือนเกี่ยวกับคำสั่งซื้อและโปรโมชั่นที่นี่
      </p>
    </div>

    <!-- Notifications List -->
    <div v-else class="divide-y divide-gray-200">
      <button
        v-for="notification in notifications"
        :key="notification.id"
        @click="markAsRead(notification.id)"
        class="w-full flex gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
        :class="{ 'bg-blue-50': !notification.read }"
      >
        <!-- Icon -->
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          :class="getTypeColor(notification.type)"
        >
          <component :is="notification.icon" class="w-6 h-6" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3
            class="font-semibold text-gray-900 mb-1"
            :class="{ 'font-bold': !notification.read }"
          >
            {{ notification.title }}
          </h3>
          <p class="text-sm text-gray-600 mb-2">{{ notification.message }}</p>
          <p class="text-xs text-gray-400">{{ notification.time }}</p>
        </div>

        <!-- Unread Indicator -->
        <div v-if="!notification.read" class="flex-shrink-0">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </button>
    </div>

    <!-- Settings Link -->
    <div class="p-4">
      <button
        @click="router.push('/customer/settings')"
        class="w-full flex items-center justify-center gap-2 py-3 text-gray-600 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Settings class="w-5 h-5" />
        <span>ตั้งค่าการแจ้งเตือน</span>
      </button>
    </div>
  </div>
</template>
