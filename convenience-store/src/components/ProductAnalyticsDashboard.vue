<script setup>
import { ref, onMounted } from "vue";
import { useProductAnalytics } from "../composables/useProductAnalytics";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Eye,
  ShoppingCart,
  DollarSign,
  BarChart3,
  X,
  Loader2,
} from "lucide-vue-next";

const emit = defineEmits(["close"]);

const {
  analytics,
  topSelling,
  mostViewed,
  loading,
  fetchAnalytics,
  fetchTopSelling,
  fetchMostViewed,
} = useProductAnalytics();

const activeTab = ref("overview");

onMounted(async () => {
  await Promise.all([
    fetchAnalytics(),
    fetchTopSelling(10),
    fetchMostViewed(10),
  ]);
});

const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val);
const formatNumber = (val) => new Intl.NumberFormat("th-TH").format(val);
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="flex items-center gap-3">
          <BarChart3 class="w-6 h-6 text-blue-600" />
          <h2 class="text-xl font-bold">Product Analytics</h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b px-6">
        <div class="flex gap-4">
          <button
            @click="activeTab = 'overview'"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            ภาพรวม
          </button>
          <button
            @click="activeTab = 'top-selling'"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'top-selling'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            สินค้าขายดี
          </button>
          <button
            @click="activeTab = 'most-viewed'"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'most-viewed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            สินค้ายอดนิยม
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
        </div>

        <!-- Overview Tab -->
        <div v-else-if="activeTab === 'overview'" class="space-y-6">
          <!-- Stats Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Total Products -->
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-blue-600 rounded-lg">
                  <Package class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-blue-900"
                  >สินค้าทั้งหมด</span
                >
              </div>
              <p class="text-3xl font-bold text-blue-900">
                {{ formatNumber(analytics.total_products) }}
              </p>
              <p class="text-xs text-blue-700 mt-1">
                เปิดขาย {{ formatNumber(analytics.active_products) }} รายการ
              </p>
            </div>

            <!-- Low Stock -->
            <div
              class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-orange-600 rounded-lg">
                  <AlertTriangle class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-orange-900"
                  >สต็อกเหลือน้อย</span
                >
              </div>
              <p class="text-3xl font-bold text-orange-900">
                {{ formatNumber(analytics.low_stock_products) }}
              </p>
              <p class="text-xs text-orange-700 mt-1">ต้องเติมสต็อก</p>
            </div>

            <!-- Out of Stock -->
            <div
              class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-red-600 rounded-lg">
                  <XCircle class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-red-900">สินค้าหมด</span>
              </div>
              <p class="text-3xl font-bold text-red-900">
                {{ formatNumber(analytics.out_of_stock_products) }}
              </p>
              <p class="text-xs text-red-700 mt-1">ไม่พร้อมขาย</p>
            </div>

            <!-- Avg Price -->
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-green-600 rounded-lg">
                  <DollarSign class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-green-900"
                  >ราคาเฉลี่ย</span
                >
              </div>
              <p class="text-3xl font-bold text-green-900">
                ฿{{ formatCurrency(analytics.avg_price) }}
              </p>
              <p class="text-xs text-green-700 mt-1">ต่อสินค้า</p>
            </div>
          </div>

          <!-- Engagement Stats -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white border rounded-xl p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="p-3 bg-purple-100 rounded-lg">
                  <Eye class="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p class="text-sm text-gray-600">ยอดดูทั้งหมด</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatNumber(analytics.total_views) }}
                  </p>
                </div>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-purple-600 rounded-full"
                  style="width: 75%"
                ></div>
              </div>
            </div>

            <div class="bg-white border rounded-xl p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart class="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p class="text-sm text-gray-600">ยอดขายทั้งหมด</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatNumber(analytics.total_purchases) }}
                  </p>
                </div>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-600 rounded-full"
                  style="width: 60%"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Selling Tab -->
        <div v-else-if="activeTab === 'top-selling'" class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <TrendingUp class="w-5 h-5 text-green-600" />
            <h3 class="text-lg font-semibold">สินค้าขายดี Top 10</h3>
          </div>

          <div
            v-if="topSelling.length === 0"
            class="text-center py-12 text-gray-500"
          >
            <ShoppingCart class="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>ยังไม่มีข้อมูลการขาย</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(product, index) in topSelling"
              :key="product.id"
              class="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow"
            >
              <!-- Rank -->
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  index === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : index === 1
                    ? 'bg-gray-100 text-gray-700'
                    : index === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-50 text-blue-600',
                ]"
              >
                {{ index + 1 }}
              </div>

              <!-- Image -->
              <img
                :src="product.image || '/placeholder.png'"
                :alt="product.name"
                class="w-16 h-16 object-cover rounded-lg bg-gray-100"
              />

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 truncate">
                  {{ product.name }}
                </h4>
                <p class="text-sm text-gray-500 truncate">
                  {{ product.name_en }}
                </p>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm font-medium text-green-600"
                    >฿{{ formatCurrency(product.price) }}</span
                  >
                  <span class="text-xs text-gray-500"
                    >สต็อก: {{ product.stock }}</span
                  >
                </div>
              </div>

              <!-- Stats -->
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">
                  {{ formatNumber(product.purchase_count) }}
                </p>
                <p class="text-xs text-gray-500">ยอดขาย</p>
                <p class="text-sm font-medium text-green-600 mt-1">
                  ฿{{ formatCurrency(product.revenue) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Most Viewed Tab -->
        <div v-else-if="activeTab === 'most-viewed'" class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <Eye class="w-5 h-5 text-purple-600" />
            <h3 class="text-lg font-semibold">สินค้ายอดนิยม Top 10</h3>
          </div>

          <div
            v-if="mostViewed.length === 0"
            class="text-center py-12 text-gray-500"
          >
            <Eye class="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>ยังไม่มีข้อมูลการดู</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(product, index) in mostViewed"
              :key="product.id"
              class="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow"
            >
              <!-- Rank -->
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  index === 0
                    ? 'bg-purple-100 text-purple-700'
                    : index === 1
                    ? 'bg-purple-50 text-purple-600'
                    : index === 2
                    ? 'bg-purple-50 text-purple-500'
                    : 'bg-gray-50 text-gray-600',
                ]"
              >
                {{ index + 1 }}
              </div>

              <!-- Image -->
              <img
                :src="product.image || '/placeholder.png'"
                :alt="product.name"
                class="w-16 h-16 object-cover rounded-lg bg-gray-100"
              />

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 truncate">
                  {{ product.name }}
                </h4>
                <p class="text-sm text-gray-500 truncate">
                  {{ product.name_en }}
                </p>
                <span class="text-sm font-medium text-green-600"
                  >฿{{ formatCurrency(product.price) }}</span
                >
              </div>

              <!-- Stats -->
              <div class="text-right">
                <p class="text-lg font-bold text-purple-600">
                  {{ formatNumber(product.view_count) }}
                </p>
                <p class="text-xs text-gray-500">ยอดดู</p>
                <p class="text-sm text-gray-600 mt-1">
                  ขาย: {{ formatNumber(product.purchase_count) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t px-6 py-4 bg-gray-50">
        <button
          @click="emit('close')"
          class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>
