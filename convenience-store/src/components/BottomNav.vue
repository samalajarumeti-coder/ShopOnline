<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useCartStore } from "../stores/cart";
import { useOrdersStore } from "../stores/orders";
import { useAuthStore } from "../stores/auth";
import {
  Home,
  Grid3X3,
  ClipboardList,
  ShoppingCart,
  User,
} from "lucide-vue-next";

const route = useRoute();
const cartStore = useCartStore();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();

// Count pending orders
const pendingOrdersCount = computed(() => {
  return ordersStore.orders.filter((o) =>
    ["pending", "confirmed", "preparing", "delivering"].includes(o.status)
  ).length;
});

const navItems = [
  { path: "/customer", name: "หน้าแรก", icon: Home },
  { path: "/customer/categories", name: "หมวดหมู่", icon: Grid3X3 },
  {
    path: "/customer/orders",
    name: "คำสั่งซื้อ",
    icon: ClipboardList,
    showOrderBadge: true,
  },
  {
    path: "/customer/cart",
    name: "ตะกร้า",
    icon: ShoppingCart,
    showBadge: true,
  },
  { path: "/customer/profile", name: "โปรไฟล์", icon: User },
];

const isActive = (path) =>
  route.path === path ||
  (path === "/customer" && route.path === "/") ||
  (path === "/customer/orders" && route.path.startsWith("/customer/order"));

// Fetch orders on mount if logged in
onMounted(async () => {
  if (authStore.isLoggedIn && ordersStore.orders.length === 0) {
    await ordersStore.fetchOrders();
  }
});
</script>

<template>
  <nav
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 safe-bottom z-50"
    role="navigation"
    aria-label="เมนูหลัก"
  >
    <div class="flex justify-around items-center py-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-0.5 px-3 py-1 relative touch-feedback transition-all duration-200"
        :class="
          isActive(item.path)
            ? 'text-[#007f3e] scale-105'
            : 'text-gray-500 hover:text-gray-700'
        "
        :aria-label="item.name"
        :aria-current="isActive(item.path) ? 'page' : undefined"
      >
        <div class="relative">
          <component
            :is="item.icon"
            class="w-6 h-6 transition-transform duration-200"
            aria-hidden="true"
          />
          <!-- Cart badge -->
          <Transition name="badge">
            <span
              v-if="item.showBadge && cartStore.totalItems > 0"
              class="absolute -top-1.5 -right-1.5 bg-[#f27220] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
            >
              {{ cartStore.totalItems > 9 ? "9+" : cartStore.totalItems }}
            </span>
          </Transition>
          <!-- Orders badge -->
          <Transition name="badge">
            <span
              v-if="item.showOrderBadge && pendingOrdersCount > 0"
              class="absolute -top-1.5 -right-1.5 bg-[#007f3e] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
            >
              {{ pendingOrdersCount > 9 ? "9+" : pendingOrdersCount }}
            </span>
          </Transition>
        </div>
        <span class="text-xs font-medium">{{ item.name }}</span>
        <!-- Active indicator -->
        <div
          v-if="isActive(item.path)"
          class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#007f3e] rounded-full"
        />
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.badge-enter-active,
.badge-leave-active {
  transition: all 0.3s ease;
}

.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
