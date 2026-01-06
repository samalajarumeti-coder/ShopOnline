<script setup>
import { ref, computed, onMounted } from "vue";
import {
  CalendarClock,
  Users,
  TrendingUp,
  Package,
  RefreshCw,
  DollarSign,
  ShoppingBag,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Eye,
  Calendar,
  Clock,
  Percent,
  Settings,
  Save,
} from "lucide-vue-next";
import { supabase } from "../../lib/supabase";

// State
const loading = ref(true);
const refreshing = ref(false);
const stats = ref({
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  pausedSubscriptions: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  avgOrderValue: 0,
  totalOrders: 0,
  successRate: 0,
});
const topProducts = ref([]);
const frequencyDistribution = ref([]);
const recentOrders = ref([]);
const subscriptionTrend = ref([]);
const discountSettings = ref({
  default_discount_percent: 5,
  max_discount_percent: 15,
  loyalty_bonus_enabled: true,
  loyalty_bonus_percent: 2,
  min_subscription_days: 0,
});
const savingSettings = ref(false);
const showSettingsModal = ref(false);

// Fetch all analytics data
async function fetchAnalytics() {
  loading.value = true;
  try {
    await Promise.all([
      fetchStats(),
      fetchTopProducts(),
      fetchFrequencyDistribution(),
      fetchRecentOrders(),
      fetchTrend(),
      fetchDiscountSettings(),
    ]);
  } catch (error) {
    console.error("Error fetching analytics:", error);
  } finally {
    loading.value = false;
  }
}

// Fetch basic stats
async function fetchStats() {
  // Total subscriptions
  const { count: total } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true });

  // Active subscriptions
  const { count: active } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Subscription orders
  const { data: subOrders } = await supabase
    .from("subscription_orders")
    .select(
      `
      status,
      orders (
        total,
        created_at
      )
    `
    )
    .eq("status", "created");

  // Calculate revenue
  let totalRevenue = 0;
  let monthlyRevenue = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const order of subOrders || []) {
    if (order.orders?.total) {
      totalRevenue += order.orders.total;
      if (new Date(order.orders.created_at) >= monthStart) {
        monthlyRevenue += order.orders.total;
      }
    }
  }

  // Success rate
  const { count: totalAttempts } = await supabase
    .from("subscription_orders")
    .select("*", { count: "exact", head: true });

  const { count: successfulAttempts } = await supabase
    .from("subscription_orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "created");

  stats.value = {
    totalSubscriptions: total || 0,
    activeSubscriptions: active || 0,
    pausedSubscriptions: (total || 0) - (active || 0),
    totalRevenue,
    monthlyRevenue,
    avgOrderValue: subOrders?.length ? totalRevenue / subOrders.length : 0,
    totalOrders: subOrders?.length || 0,
    successRate: totalAttempts
      ? ((successfulAttempts || 0) / totalAttempts) * 100
      : 0,
  };
}

// Fetch top products in subscriptions
async function fetchTopProducts() {
  const { data } = await supabase.from("subscription_items").select(`
      product_id,
      quantity,
      products (
        id,
        name,
        price,
        image
      )
    `);

  // Aggregate by product
  const productMap = new Map();
  for (const item of data || []) {
    if (!item.products) continue;

    const existing = productMap.get(item.product_id);
    if (existing) {
      existing.subscriptionCount++;
      existing.totalQuantity += item.quantity;
    } else {
      productMap.set(item.product_id, {
        ...item.products,
        subscriptionCount: 1,
        totalQuantity: item.quantity,
      });
    }
  }

  topProducts.value = Array.from(productMap.values())
    .sort((a, b) => b.subscriptionCount - a.subscriptionCount)
    .slice(0, 10);
}

// Fetch frequency distribution
async function fetchFrequencyDistribution() {
  const { data } = await supabase
    .from("subscriptions")
    .select("frequency")
    .eq("is_active", true);

  const distribution = { weekly: 0, biweekly: 0, monthly: 0 };
  for (const sub of data || []) {
    if (distribution[sub.frequency] !== undefined) {
      distribution[sub.frequency]++;
    }
  }

  frequencyDistribution.value = [
    { label: "ทุกสัปดาห์", value: distribution.weekly, color: "bg-blue-500" },
    {
      label: "ทุก 2 สัปดาห์",
      value: distribution.biweekly,
      color: "bg-purple-500",
    },
    { label: "ทุกเดือน", value: distribution.monthly, color: "bg-green-500" },
  ];
}

// Fetch recent subscription orders
async function fetchRecentOrders() {
  const { data } = await supabase
    .from("subscription_orders")
    .select(
      `
      *,
      subscriptions (
        name,
        user_id,
        profiles:user_id (
          full_name
        )
      ),
      orders (
        id,
        total,
        status
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  recentOrders.value = data || [];
}

// Fetch subscription trend (last 7 days)
async function fetchTrend() {
  const days = 7;
  const trend = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const { count } = await supabase
      .from("subscription_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "created")
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    trend.push({
      date: dateStr,
      label: date.toLocaleDateString("th-TH", { weekday: "short" }),
      count: count || 0,
    });
  }

  subscriptionTrend.value = trend;
}

// Fetch discount settings
async function fetchDiscountSettings() {
  const { data } = await supabase
    .from("subscription_discount_settings")
    .select("*")
    .single();

  if (data) {
    discountSettings.value = data;
  }
}

// Save discount settings
async function saveDiscountSettings() {
  savingSettings.value = true;
  try {
    const { error } = await supabase
      .from("subscription_discount_settings")
      .update({
        default_discount_percent:
          discountSettings.value.default_discount_percent,
        max_discount_percent: discountSettings.value.max_discount_percent,
        loyalty_bonus_enabled: discountSettings.value.loyalty_bonus_enabled,
        loyalty_bonus_percent: discountSettings.value.loyalty_bonus_percent,
        min_subscription_days: discountSettings.value.min_subscription_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", discountSettings.value.id);

    if (error) throw error;
    showSettingsModal.value = false;
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("เกิดข้อผิดพลาดในการบันทึก");
  } finally {
    savingSettings.value = false;
  }
}

// Refresh data
async function refresh() {
  refreshing.value = true;
  await fetchAnalytics();
  refreshing.value = false;
}

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(value);
};

// Format date
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get status badge class
const getStatusClass = (status) => {
  const classes = {
    created: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    skipped: "bg-gray-100 text-gray-700",
  };
  return classes[status] || "bg-gray-100 text-gray-700";
};

// Get status label
const getStatusLabel = (status) => {
  const labels = {
    created: "สำเร็จ",
    pending: "รอดำเนินการ",
    failed: "ล้มเหลว",
    skipped: "ข้าม",
  };
  return labels[status] || status;
};

// Calculate max for chart
const maxTrendValue = computed(() => {
  return Math.max(...subscriptionTrend.value.map((t) => t.count), 1);
});

// Total frequency
const totalFrequency = computed(() => {
  return frequencyDistribution.value.reduce((sum, f) => sum + f.value, 0);
});

onMounted(() => {
  fetchAnalytics();
});
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Subscription Analytics</h1>
        <p class="text-gray-500 text-sm mt-1">ภาพรวมระบบสั่งซื้ออัตโนมัติ</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="showSettingsModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Settings class="w-4 h-4" />
          ตั้งค่าส่วนลด
        </button>
        <button
          @click="refresh"
          :disabled="refreshing"
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
          รีเฟรช
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <RefreshCw class="w-8 h-8 text-purple-600 animate-spin" />
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Active Subscriptions -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Active Subscriptions</p>
              <p class="text-2xl font-bold text-gray-800">
                {{ stats.activeSubscriptions }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                จากทั้งหมด {{ stats.totalSubscriptions }} รายการ
              </p>
            </div>
            <div
              class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"
            >
              <CalendarClock class="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <!-- Monthly Revenue -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">รายได้เดือนนี้</p>
              <p class="text-2xl font-bold text-green-600">
                {{ formatCurrency(stats.monthlyRevenue) }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                รวมทั้งหมด {{ formatCurrency(stats.totalRevenue) }}
              </p>
            </div>
            <div
              class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
            >
              <DollarSign class="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <!-- Total Orders -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">คำสั่งซื้อจาก Subscription</p>
              <p class="text-2xl font-bold text-gray-800">
                {{ stats.totalOrders }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                เฉลี่ย {{ formatCurrency(stats.avgOrderValue) }}/ออเดอร์
              </p>
            </div>
            <div
              class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <ShoppingBag class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <!-- Success Rate -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">อัตราสำเร็จ</p>
              <p class="text-2xl font-bold text-gray-800">
                {{ stats.successRate.toFixed(1) }}%
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ stats.pausedSubscriptions }} หยุดชั่วคราว
              </p>
            </div>
            <div
              class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center"
            >
              <TrendingUp class="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Trend Chart -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-purple-600" />
            คำสั่งซื้อ 7 วันล่าสุด
          </h3>
          <div class="flex items-end gap-2 h-40">
            <div
              v-for="day in subscriptionTrend"
              :key="day.date"
              class="flex-1 flex flex-col items-center"
            >
              <span class="text-xs text-gray-500 mb-1">{{ day.count }}</span>
              <div
                class="w-full bg-purple-500 rounded-t transition-all"
                :style="{
                  height: `${(day.count / maxTrendValue) * 100}%`,
                  minHeight: '4px',
                }"
              />
              <span class="text-xs text-gray-500 mt-2">{{ day.label }}</span>
            </div>
          </div>
        </div>

        <!-- Frequency Distribution -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-purple-600" />
            การกระจายความถี่
          </h3>
          <div class="space-y-3">
            <div
              v-for="freq in frequencyDistribution"
              :key="freq.label"
              class="flex items-center gap-3"
            >
              <div class="w-24 text-sm text-gray-600">{{ freq.label }}</div>
              <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  :class="freq.color"
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: `${
                      totalFrequency ? (freq.value / totalFrequency) * 100 : 0
                    }%`,
                  }"
                />
              </div>
              <div class="w-12 text-right text-sm font-medium">
                {{ freq.value }}
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            รวม {{ totalFrequency }} subscriptions ที่ใช้งานอยู่
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Products -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package class="w-5 h-5 text-purple-600" />
            สินค้ายอดนิยมใน Subscription
          </h3>
          <div class="space-y-3 max-h-80 overflow-y-auto">
            <div
              v-for="(product, index) in topProducts"
              :key="product.id"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
            >
              <span
                class="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold"
              >
                {{ index + 1 }}
              </span>
              <img
                :src="product.image"
                :alt="product.name"
                class="w-10 h-10 rounded-lg object-cover"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ product.name }}
                </p>
                <p class="text-xs text-gray-500">฿{{ product.price }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-purple-600">
                  {{ product.subscriptionCount }}
                </p>
                <p class="text-xs text-gray-500">subscriptions</p>
              </div>
            </div>
            <div
              v-if="topProducts.length === 0"
              class="text-center py-8 text-gray-400"
            >
              ยังไม่มีข้อมูล
            </div>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-purple-600" />
            คำสั่งซื้อล่าสุดจาก Subscription
          </h3>
          <div class="space-y-3 max-h-80 overflow-y-auto">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ order.subscriptions?.name || "Unknown" }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    order.subscriptions?.profiles?.full_name || "Unknown User"
                  }}
                </p>
              </div>
              <div class="text-right">
                <span
                  :class="getStatusClass(order.status)"
                  class="text-xs px-2 py-0.5 rounded-full"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
                <p class="text-xs text-gray-400 mt-1">
                  {{ formatDate(order.created_at) }}
                </p>
              </div>
            </div>
            <div
              v-if="recentOrders.length === 0"
              class="text-center py-8 text-gray-400"
            >
              ยังไม่มีคำสั่งซื้อ
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Discount Settings Modal -->
    <Teleport to="body">
      <div
        v-if="showSettingsModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showSettingsModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6">
          <h3
            class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"
          >
            <Percent class="w-5 h-5 text-purple-600" />
            ตั้งค่าส่วนลด Subscription
          </h3>

          <div class="space-y-4">
            <!-- Default Discount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ส่วนลดเริ่มต้น (%)
              </label>
              <input
                v-model.number="discountSettings.default_discount_percent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                ส่วนลดที่ผู้ใช้ได้รับเมื่อสมัคร Subscription
              </p>
            </div>

            <!-- Max Discount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ส่วนลดสูงสุด (%)
              </label>
              <input
                v-model.number="discountSettings.max_discount_percent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                ส่วนลดสูงสุดที่ได้รับ (รวม loyalty bonus)
              </p>
            </div>

            <!-- Loyalty Bonus -->
            <div class="border-t pt-4">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">
                  เปิดใช้ Loyalty Bonus
                </label>
                <button
                  @click="
                    discountSettings.loyalty_bonus_enabled =
                      !discountSettings.loyalty_bonus_enabled
                  "
                  :class="[
                    'relative w-12 h-6 rounded-full transition-colors',
                    discountSettings.loyalty_bonus_enabled
                      ? 'bg-purple-600'
                      : 'bg-gray-300',
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      discountSettings.loyalty_bonus_enabled
                        ? 'left-7'
                        : 'left-1',
                    ]"
                  />
                </button>
              </div>

              <div v-if="discountSettings.loyalty_bonus_enabled">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Loyalty Bonus ต่อเดือน (%)
                </label>
                <input
                  v-model.number="discountSettings.loyalty_bonus_percent"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                  ส่วนลดเพิ่มต่อเดือนที่สมัคร (สูงสุด 3 เดือน)
                </p>
              </div>
            </div>

            <!-- Preview -->
            <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p class="text-sm font-medium text-purple-800 mb-2">
                ตัวอย่างส่วนลด:
              </p>
              <div class="text-xs text-purple-600 space-y-1">
                <p>
                  • เดือนที่ 1: {{ discountSettings.default_discount_percent }}%
                </p>
                <p v-if="discountSettings.loyalty_bonus_enabled">
                  • เดือนที่ 2:
                  {{
                    Math.min(
                      discountSettings.default_discount_percent +
                        discountSettings.loyalty_bonus_percent,
                      discountSettings.max_discount_percent
                    )
                  }}%
                </p>
                <p v-if="discountSettings.loyalty_bonus_enabled">
                  • เดือนที่ 3+:
                  {{
                    Math.min(
                      discountSettings.default_discount_percent +
                        discountSettings.loyalty_bonus_percent * 3,
                      discountSettings.max_discount_percent
                    )
                  }}%
                </p>
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="showSettingsModal = false"
              class="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
            >
              ยกเลิก
            </button>
            <button
              @click="saveDiscountSettings"
              :disabled="savingSettings"
              class="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save v-if="!savingSettings" class="w-4 h-4" />
              <RefreshCw v-else class="w-4 h-4 animate-spin" />
              {{ savingSettings ? "กำลังบันทึก..." : "บันทึก" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
