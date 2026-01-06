<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import {
  Users,
  Search,
  RefreshCw,
  Edit3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  X,
  AlertCircle,
  CheckCircle,
  Crown,
  Briefcase,
  UserCog,
  LogOut,
} from "lucide-vue-next";

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const filterRole = ref("all");
const editingUser = ref(null);
const forceLogoutUser = ref(null);
const actionLoading = ref(false);
const successMessage = ref("");

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    icon: Crown,
    color: "text-red-600 bg-red-100",
    description: "สิทธิ์เต็ม จัดการทุกอย่างได้",
    permissions: {
      products: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, edit: true, delete: true },
      users: { view: true, edit: true },
      settings: { view: true, edit: true },
    },
  },
  {
    value: "manager",
    label: "Manager",
    icon: Briefcase,
    color: "text-purple-600 bg-purple-100",
    description: "จัดการ orders, products แต่ลบไม่ได้",
    permissions: {
      products: { view: true, create: true, edit: true, delete: false },
      orders: { view: true, edit: true, delete: false },
      users: { view: true, edit: false },
      settings: { view: true, edit: false },
    },
  },
  {
    value: "staff",
    label: "Staff",
    icon: UserCog,
    color: "text-blue-600 bg-blue-100",
    description: "ดู orders และอัพเดทสถานะได้",
    permissions: {
      products: { view: true, create: false, edit: false, delete: false },
      orders: { view: true, edit: true, delete: false },
      users: { view: false, edit: false },
      settings: { view: false, edit: false },
    },
  },
  {
    value: "customer",
    label: "Customer",
    icon: User,
    color: "text-gray-600 bg-gray-100",
    description: "ลูกค้าทั่วไป",
    permissions: {
      products: { view: true, create: false, edit: false, delete: false },
      orders: { view: false, edit: false, delete: false },
      users: { view: false, edit: false },
      settings: { view: false, edit: false },
    },
  },
];

const filteredUsers = computed(() => {
  let result = users.value;
  if (filterRole.value !== "all") {
    result = result.filter((u) => u.role === filterRole.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
    );
  }
  return result;
});

const roleStats = computed(() => ({
  total: users.value.length,
  admin: users.value.filter((u) => u.role === "admin").length,
  manager: users.value.filter((u) => u.role === "manager").length,
  staff: users.value.filter((u) => u.role === "staff").length,
  customer: users.value.filter((u) => u.role === "customer").length,
}));

async function fetchUsers() {
  loading.value = true;
  error.value = "";
  try {
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) throw err;
    users.value = data || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function getRoleConfig(role) {
  return roleOptions.find((r) => r.value === role) || roleOptions[3];
}

function openEditModal(user) {
  editingUser.value = { ...user };
}

async function saveUser() {
  if (!editingUser.value) return;
  actionLoading.value = true;
  error.value = "";
  try {
    // Use secure RPC function that validates last admin on server
    const { data, error: err } = await supabase.rpc("change_user_role", {
      target_user_id: editingUser.value.id,
      new_role: editingUser.value.role,
    });

    if (err) throw err;

    // Check if function returned error
    if (data && !data.success) {
      throw new Error(data.error);
    }

    // Update local state
    const idx = users.value.findIndex((u) => u.id === editingUser.value.id);
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], role: editingUser.value.role };
    }

    successMessage.value = `อัพเดท role สำเร็จ (${data.old_role} → ${data.new_role})`;
    setTimeout(() => (successMessage.value = ""), 3000);
    editingUser.value = null;
  } catch (e) {
    error.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Force logout user
async function confirmForceLogout() {
  if (!forceLogoutUser.value) return;
  actionLoading.value = true;
  error.value = "";
  try {
    await authStore.forceLogoutUser(
      forceLogoutUser.value.id,
      "บัญชีถูกบังคับออกจากระบบโดยผู้ดูแล"
    );

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: "force_logout",
      p_entity_type: "user",
      p_entity_id: forceLogoutUser.value.id,
      p_old_value: null,
      p_new_value: { user_name: forceLogoutUser.value.full_name },
    });

    successMessage.value = `บังคับ logout ${
      forceLogoutUser.value.full_name || "ผู้ใช้"
    } สำเร็จ`;
    setTimeout(() => (successMessage.value = ""), 3000);
    forceLogoutUser.value = null;
  } catch (e) {
    error.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

onMounted(fetchUsers);
</script>

<template>
  <div>
    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Users class="w-7 h-7 text-green-600" />
          จัดการผู้ใช้งาน
        </h1>
        <p class="text-gray-500 text-sm mt-1">จัดการ role และสิทธิ์ของผู้ใช้</p>
      </div>
      <button
        @click="fetchUsers"
        class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        <span>รีเฟรช</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-gray-500 text-sm">ทั้งหมด</p>
        <p class="text-2xl font-bold text-gray-800">{{ roleStats.total }}</p>
      </div>
      <div class="bg-red-50 rounded-xl p-4 shadow-sm">
        <p class="text-red-600 text-sm flex items-center gap-1">
          <Crown class="w-4 h-4" /> Admin
        </p>
        <p class="text-2xl font-bold text-red-700">{{ roleStats.admin }}</p>
      </div>
      <div class="bg-purple-50 rounded-xl p-4 shadow-sm">
        <p class="text-purple-600 text-sm flex items-center gap-1">
          <Briefcase class="w-4 h-4" /> Manager
        </p>
        <p class="text-2xl font-bold text-purple-700">
          {{ roleStats.manager }}
        </p>
      </div>
      <div class="bg-blue-50 rounded-xl p-4 shadow-sm">
        <p class="text-blue-600 text-sm flex items-center gap-1">
          <UserCog class="w-4 h-4" /> Staff
        </p>
        <p class="text-2xl font-bold text-blue-700">{{ roleStats.staff }}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-4 shadow-sm">
        <p class="text-gray-600 text-sm flex items-center gap-1">
          <User class="w-4 h-4" /> Customer
        </p>
        <p class="text-2xl font-bold text-gray-700">{{ roleStats.customer }}</p>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาด้วยชื่อ, เบอร์โทร..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          v-model="filterRole"
          class="border rounded-lg px-4 py-2 min-w-[140px]"
        >
          <option value="all">ทุก Role</option>
          <option v-for="r in roleOptions" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Messages -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
    >
      <AlertCircle class="w-5 h-5" />
      <span>{{ error }}</span>
      <button @click="error = ''" class="ml-auto"><X class="w-4 h-4" /></button>
    </div>

    <div
      v-if="successMessage"
      class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
    >
      <CheckCircle class="w-5 h-5" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ผู้ใช้
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                เบอร์โทร
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Role
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                แต้ม
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                สมัครเมื่อ
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                กำลังโหลด...
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                ไม่พบผู้ใช้
              </td>
            </tr>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <User class="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">
                      {{ user.full_name || "ไม่ระบุชื่อ" }}
                    </p>
                    <p class="text-xs text-gray-400 font-mono">
                      {{ user.id.slice(0, 8) }}...
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ user.phone || "-" }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    getRoleConfig(user.role).color,
                  ]"
                >
                  <component
                    :is="getRoleConfig(user.role).icon"
                    class="w-3 h-3"
                  />
                  {{ getRoleConfig(user.role).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ user.points || 0 }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button
                    @click="openEditModal(user)"
                    class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="แก้ไข Role"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    @click="forceLogoutUser = user"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="บังคับ Logout"
                    :disabled="user.id === authStore.user?.id"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        user.id === authStore.user?.id,
                    }"
                  >
                    <LogOut class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Role Permissions Matrix -->
    <div class="mt-6 bg-white rounded-xl p-4 shadow-sm">
      <h3 class="font-bold mb-4 flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-green-600" />
        Permission Matrix
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-3">Role</th>
              <th class="text-center py-2 px-2">
                Products<br /><span class="text-xs text-gray-400"
                  >ดู/สร้าง/แก้/ลบ</span
                >
              </th>
              <th class="text-center py-2 px-2">
                Orders<br /><span class="text-xs text-gray-400">ดู/แก้/ลบ</span>
              </th>
              <th class="text-center py-2 px-2">
                Users<br /><span class="text-xs text-gray-400">ดู/แก้</span>
              </th>
              <th class="text-center py-2 px-2">
                Settings<br /><span class="text-xs text-gray-400">ดู/แก้</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="role in roleOptions"
              :key="role.value"
              class="border-b hover:bg-gray-50"
            >
              <td class="py-2 px-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    role.color,
                  ]"
                >
                  <component :is="role.icon" class="w-3 h-3" />
                  {{ role.label }}
                </span>
              </td>
              <td class="text-center py-2 px-2">
                <div class="flex justify-center gap-1">
                  <span
                    :class="
                      role.permissions.products.view
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.products.view ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.products.create
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.products.create ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.products.edit
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.products.edit ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.products.delete
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.products.delete ? "✓" : "✗" }}</span
                  >
                </div>
              </td>
              <td class="text-center py-2 px-2">
                <div class="flex justify-center gap-1">
                  <span
                    :class="
                      role.permissions.orders.view
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.orders.view ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.orders.edit
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.orders.edit ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.orders.delete
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.orders.delete ? "✓" : "✗" }}</span
                  >
                </div>
              </td>
              <td class="text-center py-2 px-2">
                <div class="flex justify-center gap-1">
                  <span
                    :class="
                      role.permissions.users.view
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.users.view ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.users.edit
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.users.edit ? "✓" : "✗" }}</span
                  >
                </div>
              </td>
              <td class="text-center py-2 px-2">
                <div class="flex justify-center gap-1">
                  <span
                    :class="
                      role.permissions.settings.view
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.settings.view ? "✓" : "✗" }}</span
                  >
                  <span
                    :class="
                      role.permissions.settings.edit
                        ? 'text-green-500'
                        : 'text-red-400'
                    "
                    >{{ role.permissions.settings.edit ? "✓" : "✗" }}</span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-400 mt-3">✓ = อนุญาต, ✗ = ไม่อนุญาต</p>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="editingUser"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="editingUser = null"
      >
        <div class="bg-white rounded-xl w-full max-w-md">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold">แก้ไข Role</h3>
            <button
              @click="editingUser = null"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 space-y-4">
            <!-- User Info -->
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
              >
                <User class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p class="font-medium">
                  {{ editingUser.full_name || "ไม่ระบุชื่อ" }}
                </p>
                <p class="text-xs text-gray-500 font-mono">
                  {{ editingUser.id }}
                </p>
              </div>
            </div>

            <!-- Role Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >เลือก Role</label
              >
              <div class="space-y-2">
                <label
                  v-for="role in roleOptions"
                  :key="role.value"
                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="
                    editingUser.role === role.value
                      ? 'border-green-500 bg-green-50'
                      : 'hover:bg-gray-50'
                  "
                >
                  <input
                    type="radio"
                    :value="role.value"
                    v-model="editingUser.role"
                    class="w-4 h-4 text-green-600"
                  />
                  <span :class="['p-1.5 rounded-lg', role.color]">
                    <component :is="role.icon" class="w-4 h-4" />
                  </span>
                  <div class="flex-1">
                    <p class="font-medium text-sm">{{ role.label }}</p>
                    <p class="text-xs text-gray-500">{{ role.description }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-2">
              <button
                @click="editingUser = null"
                class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                @click="saveUser"
                :disabled="actionLoading"
                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {{ actionLoading ? "กำลังบันทึก..." : "บันทึก" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Force Logout Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="forceLogoutUser"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="forceLogoutUser = null"
      >
        <div class="bg-white rounded-xl w-full max-w-sm p-6 text-center">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <LogOut class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-lg font-bold mb-2">บังคับ Logout?</h3>
          <p class="text-gray-600 mb-2">
            {{ forceLogoutUser.full_name || "ผู้ใช้" }}
          </p>
          <p class="text-sm text-gray-400 mb-6">
            ผู้ใช้จะถูกบังคับออกจากระบบทันที
          </p>
          <div class="flex gap-2">
            <button
              @click="forceLogoutUser = null"
              class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              @click="confirmForceLogout"
              :disabled="actionLoading"
              class="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {{ actionLoading ? "กำลังดำเนินการ..." : "บังคับ Logout" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
