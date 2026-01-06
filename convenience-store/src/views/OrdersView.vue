/* Path: /orders */
<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useOrdersStore } from "../stores/orders";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const ordersStore = useOrdersStore();
const pageLoading = ref(true);

const statusConfig = {
  pending: { label: "รอยืนยัน", icon: Clock, color: "text-yellow-500" },
  confirmed: { label: "ยืนยันแล้ว", icon: CheckCircle, color: "text-blue-500" },
  preparing: { label: "กำลังเตรียม", icon: Package, color: "text-orange-500" },
  delivering: { label: "กำลังจัดส่ง", icon: Truck, color: "text-purple-500" },
  completed: { label: "สำเร็จ", icon: CheckCircle, color: "text-green-500" },
  cancelled: { label: "ยกเลิก", icon: XCircle, color: "text-red-500" },
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(async () => {
  // Router guard already handles auth check
  await ordersStore.fetchOrders();
  pageLoading.value = false;
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <!-- Header -->
    <div class="bg-white px-4 py-4 flex items-center gap-3 border-b">
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">ประวัติการสั่งซื้อ</h1>
    </div>

    <div class="px-4 py-4">
      <!-- Page Loading (waiting for auth) -->
      <div v-if="pageLoading" class="flex justify-center py-16">
        <Loader2 class="w-8 h-8 animate-spin text-[#007f3e]" />
      </div>

      <!-- Skeleton Loading (fetching orders) -->
      <template v-else-if="ordersStore.loading">
        <div class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white rounded-xl p-4 shadow-sm"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div class="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div class="h-5 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
            <div class="border-t pt-3">
              <div class="flex justify-between">
                <div class="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div class="h-5 bg-gray-200 rounded w-14 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div
        v-else-if="ordersStore.orders.length === 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <div
          class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <Package class="w-10 h-10 text-gray-300" />
        </div>
        <p class="text-gray-700 text-lg font-medium">
          ยังไม่มีประวัติการสั่งซื้อ
        </p>
        <p class="text-gray-400 text-sm mt-1">เริ่มสั่งซื้อสินค้าวันนี้</p>
        <router-link
          to="/customer"
          class="mt-6 bg-[#007f3e] text-white px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-transform"
        >
          เริ่มช้อปปิ้ง
        </router-link>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-3">
        <router-link
          v-for="order in ordersStore.orders"
          :key="order.id"
          :to="`/customer/order/${order.id}`"
          class="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="text-sm text-gray-500">คำสั่งซื้อ #{{ order.id }}</p>
              <p
                v-if="order.tracking_id"
                class="text-xs font-mono text-purple-600 mt-0.5"
              >
                {{ order.tracking_id }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ formatDate(order.created_at) }}
              </p>
            </div>
            <div
              class="flex items-center gap-1"
              :class="statusConfig[order.status]?.color || 'text-gray-500'"
            >
              <component
                :is="statusConfig[order.status]?.icon || Package"
                class="w-4 h-4"
              />
              <span class="text-sm font-medium">{{
                statusConfig[order.status]?.label || order.status
              }}</span>
            </div>
          </div>

          <div class="border-t pt-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600"
                >{{ order.order_items?.length || 0 }} รายการ</span
              >
              <span class="font-bold text-[#007f3e]">฿{{ order.total }}</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>
