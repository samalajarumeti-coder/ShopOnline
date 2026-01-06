<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { supabase } from "../lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
} from "lucide-vue-next";

const loading = ref(false);
const period = ref("week"); // day, week, month
const ordersData = ref([]);
const chartData = ref([]);

const periodOptions = [
  { value: "day", label: "วันนี้" },
  { value: "week", label: "7 วัน" },
  { value: "month", label: "30 วัน" },
];

// Calculate date range based on period
const dateRange = computed(() => {
  const end = new Date();
  const start = new Date();

  if (period.value === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period.value === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
});

// Fetch orders data
async function fetchOrdersData() {
  loading.value = true;
  try {
    const { start, end } = dateRange.value;

    const { data, error } = await supabase
      .from("orders")
      .select("id, total, status, created_at, user_id")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    ordersData.value = data || [];
    processChartData();
  } catch (e) {
    console.error("Failed to fetch orders:", e);
  } finally {
    loading.value = false;
  }
}

// Process data for chart
function processChartData() {
  const { start, end } = dateRange.value;
  const days = [];
  const current = new Date(start);

  while (current <= end) {
    days.push({
      date: new Date(current),
      label: current.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      }),
      orders: 0,
      revenue: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  ordersData.value.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const dayIndex = days.findIndex(
      (d) => d.date.toDateString() === orderDate.toDateString()
    );
    if (dayIndex !== -1) {
      days[dayIndex].orders++;
      if (order.status !== "cancelled") {
        days[dayIndex].revenue += Number(order.total || 0);
      }
    }
  });

  chartData.value = days;
}

// Statistics
const stats = computed(() => {
  const completed = ordersData.value.filter((o) => o.status === "completed");
  const cancelled = ordersData.value.filter((o) => o.status === "cancelled");
  const pending = ordersData.value.filter((o) => o.status === "pending");

  const totalRevenue = ordersData.value
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const avgOrderValue =
    completed.length > 0 ? totalRevenue / completed.length : 0;

  const uniqueCustomers = new Set(ordersData.value.map((o) => o.user_id)).size;

  return {
    totalOrders: ordersData.value.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    pendingOrders: pending.length,
    totalRevenue,
    avgOrderValue,
    uniqueCustomers,
  };
});

// Status distribution for pie chart
const statusDistribution = computed(() => {
  const distribution = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
  };

  ordersData.value.forEach((order) => {
    if (distribution[order.status] !== undefined) {
      distribution[order.status]++;
    }
  });

  return Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      percentage: ((count / ordersData.value.length) * 100).toFixed(1),
    }));
});

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-purple-500",
  delivering: "bg-indigo-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  preparing: "กำลังจัดเตรียม",
  delivering: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

// Max values for chart scaling
const maxRevenue = computed(() => {
  return Math.max(...chartData.value.map((d) => d.revenue), 1);
});

const maxOrders = computed(() => {
  return Math.max(...chartData.value.map((d) => d.orders), 1);
});

function formatCurrency(val) {
  return new Intl.NumberFormat("th-TH").format(val || 0);
}

watch(period, fetchOrdersData);
onMounted(fetchOrdersData);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"
        >
          <BarChart3 class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800">Order Analytics</h2>
          <p class="text-sm text-gray-500">วิเคราะห์ยอดขายและคำสั่งซื้อ</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="period" class="border rounded-lg px-3 py-2 text-sm">
          <option
            v-for="opt in periodOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <button
          @click="fetchOrdersData"
          :disabled="loading"
          class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <div class="flex items-center justify-between">
          <div
            class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
          >
            <DollarSign class="w-5 h-5 text-green-600" />
          </div>
          <TrendingUp class="w-4 h-4 text-green-500" />
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-3">
          ฿{{ formatCurrency(stats.totalRevenue) }}
        </p>
        <p class="text-sm text-gray-500">รายได้รวม</p>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <div class="flex items-center justify-between">
          <div
            class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
          >
            <ShoppingCart class="w-5 h-5 text-blue-600" />
          </div>
          <span class="text-xs text-gray-500"
            >{{ stats.pendingOrders }} รอ</span
          >
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-3">
          {{ stats.totalOrders }}
        </p>
        <p class="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <div class="flex items-center justify-between">
          <div
            class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
          >
            <Package class="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-3">
          ฿{{ formatCurrency(stats.avgOrderValue) }}
        </p>
        <p class="text-sm text-gray-500">ยอดเฉลี่ย/ออเดอร์</p>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <div class="flex items-center justify-between">
          <div
            class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
          >
            <Users class="w-5 h-5 text-orange-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-800 mt-3">
          {{ stats.uniqueCustomers }}
        </p>
        <p class="text-sm text-gray-500">ลูกค้า</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Revenue Chart -->
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-green-600" />
          รายได้รายวัน
        </h3>
        <div
          v-if="loading"
          class="h-48 flex items-center justify-center text-gray-500"
        >
          กำลังโหลด...
        </div>
        <div
          v-else-if="chartData.length === 0"
          class="h-48 flex items-center justify-center text-gray-500"
        >
          ไม่มีข้อมูล
        </div>
        <div v-else class="h-48">
          <div class="flex items-end justify-between h-40 gap-1">
            <div
              v-for="(day, index) in chartData"
              :key="index"
              class="flex-1 flex flex-col items-center"
            >
              <div
                class="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                :style="{
                  height: `${(day.revenue / maxRevenue) * 100}%`,
                  minHeight: day.revenue > 0 ? '4px' : '0',
                }"
                :title="`฿${formatCurrency(day.revenue)}`"
              ></div>
            </div>
          </div>
          <div
            class="flex justify-between mt-2 text-xs text-gray-500 overflow-hidden"
          >
            <span
              v-for="(day, index) in chartData"
              :key="index"
              class="flex-1 text-center truncate"
            >
              {{ period === "day" ? "" : day.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Status Distribution -->
      <div class="bg-white rounded-xl p-6 shadow-sm border">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PieChart class="w-5 h-5 text-blue-600" />
          สถานะคำสั่งซื้อ
        </h3>
        <div
          v-if="statusDistribution.length === 0"
          class="h-48 flex items-center justify-center text-gray-500"
        >
          ไม่มีข้อมูล
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in statusDistribution"
            :key="item.status"
            class="flex items-center gap-3"
          >
            <div
              :class="[statusColors[item.status], 'w-3 h-3 rounded-full']"
            ></div>
            <span class="flex-1 text-sm text-gray-700">{{
              statusLabels[item.status]
            }}</span>
            <span class="text-sm font-medium text-gray-800">{{
              item.count
            }}</span>
            <span class="text-xs text-gray-500 w-12 text-right"
              >{{ item.percentage }}%</span
            >
          </div>
          <!-- Progress bar -->
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden flex mt-4">
            <div
              v-for="item in statusDistribution"
              :key="item.status"
              :class="statusColors[item.status]"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Orders Chart -->
    <div class="bg-white rounded-xl p-6 shadow-sm border">
      <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <ShoppingCart class="w-5 h-5 text-blue-600" />
        จำนวนคำสั่งซื้อรายวัน
      </h3>
      <div
        v-if="loading"
        class="h-32 flex items-center justify-center text-gray-500"
      >
        กำลังโหลด...
      </div>
      <div
        v-else-if="chartData.length === 0"
        class="h-32 flex items-center justify-center text-gray-500"
      >
        ไม่มีข้อมูล
      </div>
      <div v-else class="h-32">
        <div class="flex items-end justify-between h-24 gap-1">
          <div
            v-for="(day, index) in chartData"
            :key="index"
            class="flex-1 flex flex-col items-center"
          >
            <span class="text-xs text-gray-500 mb-1">{{
              day.orders || ""
            }}</span>
            <div
              class="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
              :style="{
                height: `${(day.orders / maxOrders) * 100}%`,
                minHeight: day.orders > 0 ? '4px' : '0',
              }"
            ></div>
          </div>
        </div>
        <div
          class="flex justify-between mt-2 text-xs text-gray-500 overflow-hidden"
        >
          <span
            v-for="(day, index) in chartData"
            :key="index"
            class="flex-1 text-center truncate"
          >
            {{ period === "day" ? "" : day.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
