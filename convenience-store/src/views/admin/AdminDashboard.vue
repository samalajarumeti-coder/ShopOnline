<script setup>
import { ref, onMounted } from "vue";
import { useAdminStore } from "../../stores/admin";
import {
  ShoppingCart,
  Package,
  Users,
  Banknote,
  Clock,
  TrendingUp,
  Ticket,
  Image,
  ImageOff,
} from "lucide-vue-next";
import BrokenImageScanner from "../../components/BrokenImageScanner.vue";

const adminStore = useAdminStore();
const showImageScanner = ref(false);

onMounted(() => {
  adminStore.fetchDashboardStats();
});

function formatCurrency(value) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function handleImageFixed(results) {
  if (results.success > 0) {
    adminStore.fetchAllProducts();
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-blue-100 rounded-lg">
            <ShoppingCart class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
            <p class="text-2xl font-bold">{{ adminStore.stats.totalOrders }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-green-100 rounded-lg">
            <Banknote class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">รายได้รวม</p>
            <p class="text-2xl font-bold">
              ฿{{ formatCurrency(adminStore.stats.totalRevenue) }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-purple-100 rounded-lg">
            <Package class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">สินค้าทั้งหมด</p>
            <p class="text-2xl font-bold">
              {{ adminStore.stats.totalProducts }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-orange-100 rounded-lg">
            <Users class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">ลูกค้าทั้งหมด</p>
            <p class="text-2xl font-bold">
              {{ adminStore.stats.totalCustomers }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Today Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div
        class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-2">
          <TrendingUp class="w-6 h-6" />
          <span class="text-lg">ยอดขายวันนี้</span>
        </div>
        <p class="text-3xl font-bold">
          ฿{{ formatCurrency(adminStore.stats.todayRevenue) }}
        </p>
        <p class="text-green-100 mt-1">
          {{ adminStore.stats.todayOrders }} คำสั่งซื้อ
        </p>
      </div>

      <div
        class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-2">
          <Clock class="w-6 h-6" />
          <span class="text-lg">รอดำเนินการ</span>
        </div>
        <p class="text-3xl font-bold">{{ adminStore.stats.pendingOrders }}</p>
        <p class="text-orange-100 mt-1">คำสั่งซื้อที่รอจัดส่ง</p>
      </div>

      <div
        class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-2">
          <Package class="w-6 h-6" />
          <span class="text-lg">สินค้าทั้งหมด</span>
        </div>
        <p class="text-3xl font-bold">{{ adminStore.stats.totalProducts }}</p>
        <p class="text-blue-100 mt-1">รายการในระบบ</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-semibold mb-4">การดำเนินการด่วน</h3>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <router-link
          to="/admin/products"
          class="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <Package class="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <span class="text-sm">จัดการสินค้า</span>
        </router-link>
        <router-link
          to="/admin/orders"
          class="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <ShoppingCart class="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <span class="text-sm">ดูคำสั่งซื้อ</span>
        </router-link>
        <router-link
          to="/admin/coupons"
          class="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <Ticket class="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <span class="text-sm">จัดการคูปอง</span>
        </router-link>
        <router-link
          to="/admin/banners"
          class="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <Image class="w-8 h-8 mx-auto mb-2 text-pink-600" />
          <span class="text-sm">จัดการแบนเนอร์</span>
        </router-link>
        <button
          @click="showImageScanner = true"
          class="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <ImageOff class="w-8 h-8 mx-auto mb-2 text-red-600" />
          <span class="text-sm">สแกนรูปเสีย</span>
        </button>
      </div>
    </div>

    <!-- Broken Image Scanner Modal -->
    <div
      v-if="showImageScanner"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <BrokenImageScanner
        @close="showImageScanner = false"
        @fixed="handleImageFixed"
      />
    </div>
  </div>
</template>
