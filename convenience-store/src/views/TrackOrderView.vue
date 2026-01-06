<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  User,
} from "lucide-vue-next";
import { useOrderTracking } from "../composables/useOrderTracking";
import OrderTracking from "../components/OrderTracking.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const router = useRouter();
const {
  loading,
  error,
  getOrderByTracking,
  getStatusLabel,
  getStatusColor,
  formatTimestamp,
} = useOrderTracking();

const trackingId = ref("");
const order = ref(null);
const searched = ref(false);

const handleSearch = async () => {
  if (!trackingId.value.trim()) return;

  searched.value = true;
  order.value = await getOrderByTracking(trackingId.value.trim().toUpperCase());
};

const handleKeydown = (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
};

const clearSearch = () => {
  trackingId.value = "";
  order.value = null;
  searched.value = false;
};
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
      <h1 class="text-lg font-bold text-white">ติดตามคำสั่งซื้อ</h1>
    </div>

    <!-- Search Section -->
    <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-4 pb-6">
      <div class="bg-white rounded-xl p-4 shadow-lg">
        <p class="text-sm text-gray-600 mb-3">
          กรอกหมายเลขติดตามเพื่อตรวจสอบสถานะคำสั่งซื้อ
        </p>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="trackingId"
              type="text"
              placeholder="TRK-XXXXXXXX-XXXXXX"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
              @keydown="handleKeydown"
            />
            <button
              v-if="trackingId"
              @click="clearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle class="w-5 h-5" />
            </button>
          </div>
          <button
            @click="handleSearch"
            :disabled="loading || !trackingId.trim()"
            class="px-4 py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Search v-if="!loading" class="w-5 h-5" />
            <LoadingSpinner v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 py-4">
      <!-- Initial State -->
      <div
        v-if="!searched"
        class="flex flex-col items-center justify-center py-16"
      >
        <div
          class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4"
        >
          <Package class="w-10 h-10 text-purple-400" />
        </div>
        <p class="text-gray-700 text-lg font-medium">ติดตามคำสั่งซื้อของคุณ</p>
        <p class="text-gray-400 text-sm mt-1 text-center">
          กรอกหมายเลขติดตามที่ได้รับจากอีเมล<br />หรือ SMS เพื่อตรวจสอบสถานะ
        </p>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="flex justify-center py-16">
        <LoadingSpinner />
      </div>

      <!-- Not Found -->
      <div
        v-else-if="searched && !order"
        class="flex flex-col items-center justify-center py-16"
      >
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"
        >
          <XCircle class="w-10 h-10 text-red-400" />
        </div>
        <p class="text-gray-700 text-lg font-medium">ไม่พบคำสั่งซื้อ</p>
        <p class="text-gray-400 text-sm mt-1 text-center">
          กรุณาตรวจสอบหมายเลขติดตามอีกครั้ง<br />หรือติดต่อฝ่ายบริการลูกค้า
        </p>
        <button @click="clearSearch" class="mt-4 text-purple-600 font-medium">
          ค้นหาใหม่
        </button>
      </div>

      <!-- Order Found -->
      <div v-else-if="order" class="space-y-4">
        <!-- Order Summary Card -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs text-gray-500">หมายเลขติดตาม</p>
              <p class="font-mono font-bold text-gray-800">
                {{ order.tracking_id }}
              </p>
            </div>
            <div
              class="px-3 py-1.5 rounded-full text-sm font-medium"
              :class="[
                getStatusColor(order.status).bg,
                getStatusColor(order.status).text,
              ]"
            >
              {{ getStatusLabel(order.status) }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">วันที่สั่งซื้อ</p>
              <p class="font-medium">{{ formatTimestamp(order.created_at) }}</p>
            </div>
            <div>
              <p class="text-gray-500">ยอดรวม</p>
              <p class="font-bold text-[#007f3e]">฿{{ order.total }}</p>
            </div>
          </div>
        </div>

        <!-- Tracking Timeline -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-bold text-gray-800 mb-2">สถานะการจัดส่ง</h3>
          <OrderTracking
            :order-id="order.id"
            :tracking-id="order.tracking_id"
            :status="order.status"
            :created-at="order.created_at"
            :confirmed-at="order.confirmed_at"
            :preparing-at="order.preparing_at"
            :delivering-at="order.delivering_at"
            :completed-at="order.completed_at"
            :cancelled-at="order.cancelled_at"
            :driver-name="order.driver_name"
            :driver-phone="order.driver_phone"
            :estimated-delivery="order.estimated_delivery"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="clearSearch"
            class="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium"
          >
            ค้นหาใหม่
          </button>
          <router-link
            to="/customer/help"
            class="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium text-center"
          >
            ติดต่อเรา
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
