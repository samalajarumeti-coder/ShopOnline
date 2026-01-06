<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useAdminStore } from "../stores/admin";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  FolderTree,
  Image,
  Menu,
  X,
  LogOut,
  Store,
  Users,
  Activity,
  Award,
  CalendarClock,
  Zap,
  Gift,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const sidebarOpen = ref(false);

const menuItems = [
  { path: "/admin", icon: LayoutDashboard, label: "แดชบอร์ด" },
  { path: "/admin/products", icon: Package, label: "สินค้า" },
  { path: "/admin/flash-sale", icon: Zap, label: "Flash Sale" },
  { path: "/admin/deals", icon: Gift, label: "Deal/Bundle" },
  { path: "/admin/orders", icon: ShoppingCart, label: "คำสั่งซื้อ" },
  { path: "/admin/coupons", icon: Ticket, label: "คูปอง" },
  { path: "/admin/categories", icon: FolderTree, label: "หมวดหมู่" },
  { path: "/admin/banners", icon: Image, label: "แบนเนอร์" },
  { path: "/admin/loyalty", icon: Award, label: "Loyalty Program" },
  { path: "/admin/subscriptions", icon: CalendarClock, label: "Subscriptions" },
  { path: "/admin/users", icon: Users, label: "ผู้ใช้งาน" },
  { path: "/admin/activity", icon: Activity, label: "Activity Log" },
];

const currentPath = computed(() => route.path);

onMounted(() => {
  // Initialize realtime subscriptions
  adminStore.initRealtimeSubscriptions();
});

onUnmounted(() => {
  // Cleanup subscriptions
  adminStore.unsubscribeAll();
});

function goToShop() {
  window.open("/customer", "_blank");
}

async function logout() {
  adminStore.unsubscribeAll();
  await supabase.auth.signOut();
  sessionStorage.removeItem("admin_authenticated");
  router.push("/admin/login");
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="p-4 border-b flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Store class="w-6 h-6 text-green-600" />
            <h1 class="text-xl font-bold text-green-600">Admin Panel</h1>
          </div>
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                adminStore.isRealtimeConnected ? 'bg-green-500' : 'bg-red-500',
              ]"
              :title="
                adminStore.isRealtimeConnected
                  ? 'Realtime Connected'
                  : 'Disconnected'
              "
            />
            <button @click="sidebarOpen = false" class="lg:hidden">
              <X class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Menu -->
        <nav class="flex-1 p-4 space-y-1">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              currentPath === item.path
                ? 'bg-green-50 text-green-600'
                : 'text-gray-600 hover:bg-gray-50',
            ]"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Footer -->
        <div class="p-4 border-t space-y-2">
          <button
            @click="goToShop"
            class="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Store class="w-5 h-5" />
            <span>กลับไปหน้าร้าน</span>
          </button>
          <button
            @click="logout"
            class="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut class="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="flex items-center justify-between px-4 py-3">
          <button @click="sidebarOpen = true" class="lg:hidden">
            <Menu class="w-6 h-6" />
          </button>
          <h2 class="text-lg font-semibold text-gray-800">
            {{ route.meta.title || "Admin" }}
          </h2>
          <div class="w-6 lg:hidden" />
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
