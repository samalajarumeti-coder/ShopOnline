<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  Search,
  RefreshCw,
  User,
  Package,
  ShoppingCart,
  Ticket,
  FolderTree,
  Image,
  Users,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
} from "lucide-vue-next";

const logs = ref([]);
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const filterAction = ref("all");
const filterEntity = ref("all");
const currentPage = ref(1);
const itemsPerPage = 20;
const selectedLog = ref(null);

const actionTypes = [
  { value: "create", label: "สร้าง", color: "bg-green-100 text-green-700" },
  { value: "update", label: "แก้ไข", color: "bg-blue-100 text-blue-700" },
  { value: "delete", label: "ลบ", color: "bg-red-100 text-red-700" },
  {
    value: "login",
    label: "เข้าสู่ระบบ",
    color: "bg-purple-100 text-purple-700",
  },
  { value: "logout", label: "ออกจากระบบ", color: "bg-gray-100 text-gray-700" },
  {
    value: "role_change",
    label: "เปลี่ยน Role",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "status_change",
    label: "เปลี่ยนสถานะ",
    color: "bg-yellow-100 text-yellow-700",
  },
];

const entityTypes = [
  { value: "user", label: "ผู้ใช้", icon: Users },
  { value: "product", label: "สินค้า", icon: Package },
  { value: "order", label: "คำสั่งซื้อ", icon: ShoppingCart },
  { value: "coupon", label: "คูปอง", icon: Ticket },
  { value: "category", label: "หมวดหมู่", icon: FolderTree },
  { value: "banner", label: "แบนเนอร์", icon: Image },
];

const filteredLogs = computed(() => {
  let result = logs.value;
  if (filterAction.value !== "all") {
    result = result.filter((l) => l.action === filterAction.value);
  }
  if (filterEntity.value !== "all") {
    result = result.filter((l) => l.entity_type === filterEntity.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.entity_type?.toLowerCase().includes(q) ||
        l.entity_id?.toLowerCase().includes(q) ||
        l.profiles?.full_name?.toLowerCase().includes(q)
    );
  }
  return result;
});

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredLogs.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() =>
  Math.ceil(filteredLogs.value.length / itemsPerPage)
);

async function fetchLogs() {
  loading.value = true;
  error.value = "";
  try {
    const { data, error: err } = await supabase
      .from("activity_logs")
      .select("*, profiles:user_id(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (err) throw err;
    logs.value = data || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function getActionConfig(action) {
  return (
    actionTypes.find((a) => a.value === action) || {
      label: action,
      color: "bg-gray-100 text-gray-700",
    }
  );
}

function getEntityConfig(entity) {
  return (
    entityTypes.find((e) => e.value === entity) || {
      label: entity,
      icon: Activity,
    }
  );
}

function formatDate(date) {
  return new Date(date).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatJson(json) {
  if (!json) return "-";
  try {
    return JSON.stringify(json, null, 2);
  } catch {
    return String(json);
  }
}

onMounted(fetchLogs);
</script>

<template>
  <div>
    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Activity class="w-7 h-7 text-green-600" />
          Activity Log
        </h1>
        <p class="text-gray-500 text-sm mt-1">บันทึกการกระทำทั้งหมดในระบบ</p>
      </div>
      <button
        @click="fetchLogs"
        class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        <span>รีเฟรช</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหา..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          v-model="filterAction"
          class="border rounded-lg px-4 py-2 min-w-[140px]"
        >
          <option value="all">ทุก Action</option>
          <option v-for="a in actionTypes" :key="a.value" :value="a.value">
            {{ a.label }}
          </option>
        </select>
        <select
          v-model="filterEntity"
          class="border rounded-lg px-4 py-2 min-w-[140px]"
        >
          <option value="all">ทุก Entity</option>
          <option v-for="e in entityTypes" :key="e.value" :value="e.value">
            {{ e.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-gray-500 text-sm">ทั้งหมด</p>
        <p class="text-2xl font-bold text-gray-800">{{ logs.length }}</p>
      </div>
      <div class="bg-green-50 rounded-xl p-4 shadow-sm">
        <p class="text-green-600 text-sm">สร้าง</p>
        <p class="text-2xl font-bold text-green-700">
          {{ logs.filter((l) => l.action === "create").length }}
        </p>
      </div>
      <div class="bg-blue-50 rounded-xl p-4 shadow-sm">
        <p class="text-blue-600 text-sm">แก้ไข</p>
        <p class="text-2xl font-bold text-blue-700">
          {{ logs.filter((l) => l.action === "update").length }}
        </p>
      </div>
      <div class="bg-red-50 rounded-xl p-4 shadow-sm">
        <p class="text-red-600 text-sm">ลบ</p>
        <p class="text-2xl font-bold text-red-700">
          {{ logs.filter((l) => l.action === "delete").length }}
        </p>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                เวลา
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ผู้ใช้
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Action
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Entity
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ID
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                กำลังโหลด...
              </td>
            </tr>
            <tr v-else-if="paginatedLogs.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                ไม่พบข้อมูล
              </td>
            </tr>
            <tr
              v-for="log in paginatedLogs"
              :key="log.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <Clock class="w-4 h-4" />
                  {{ formatDate(log.created_at) }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <User class="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">
                      {{ log.profiles?.full_name || "Unknown" }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ log.profiles?.role || "-" }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getActionConfig(log.action).color,
                  ]"
                >
                  {{ getActionConfig(log.action).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <component
                    :is="getEntityConfig(log.entity_type).icon"
                    class="w-4 h-4"
                  />
                  {{ getEntityConfig(log.entity_type).label }}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 font-mono">
                {{ log.entity_id || "-" }}
              </td>
              <td class="px-4 py-3">
                <button
                  v-if="log.old_value || log.new_value"
                  @click="selectedLog = log"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <span v-else class="text-gray-400 text-sm">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t"
      >
        <p class="text-sm text-gray-500">
          หน้า {{ currentPage }} จาก {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedLog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="selectedLog = null"
      >
        <div
          class="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold">รายละเอียด Activity</h3>
            <button
              @click="selectedLog = null"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Action</p>
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getActionConfig(selectedLog.action).color,
                  ]"
                >
                  {{ getActionConfig(selectedLog.action).label }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-500">Entity</p>
                <p class="font-medium">
                  {{ getEntityConfig(selectedLog.entity_type).label }} #{{
                    selectedLog.entity_id
                  }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500">ผู้ใช้</p>
                <p class="font-medium">
                  {{ selectedLog.profiles?.full_name || "Unknown" }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500">เวลา</p>
                <p class="font-medium">
                  {{ formatDate(selectedLog.created_at) }}
                </p>
              </div>
            </div>

            <div v-if="selectedLog.old_value">
              <p class="text-sm text-gray-500 mb-2">ค่าเดิม</p>
              <pre class="bg-red-50 p-3 rounded-lg text-xs overflow-x-auto">{{
                formatJson(selectedLog.old_value)
              }}</pre>
            </div>

            <div v-if="selectedLog.new_value">
              <p class="text-sm text-gray-500 mb-2">ค่าใหม่</p>
              <pre class="bg-green-50 p-3 rounded-lg text-xs overflow-x-auto">{{
                formatJson(selectedLog.new_value)
              }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
