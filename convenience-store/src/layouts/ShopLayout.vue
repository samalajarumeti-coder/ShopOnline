<script setup>
import { onMounted, onUnmounted } from "vue";
import AppHeader from "../components/AppHeader.vue";
import BottomNav from "../components/BottomNav.vue";
import { useProductsStore } from "../stores/products";
import { useCouponsStore } from "../stores/coupons";
import { useOrdersStore } from "../stores/orders";
import { useAuthStore } from "../stores/auth";

const productsStore = useProductsStore();
const couponsStore = useCouponsStore();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();

onMounted(() => {
  // Initialize realtime subscriptions for customer
  productsStore.initRealtimeSubscriptions();
  couponsStore.initRealtimeSubscription();

  // Orders realtime only if logged in
  if (authStore.user) {
    ordersStore.initRealtimeSubscription();
  }
});

onUnmounted(() => {
  // Cleanup subscriptions
  productsStore.unsubscribeAll();
  couponsStore.unsubscribe();
  ordersStore.unsubscribe();
});
</script>

<template>
  <div
    class="app-container mx-auto bg-white min-h-screen max-w-[480px] relative shadow-xl"
  >
    <AppHeader />
    <main class="pb-20 pt-28">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app-container {
  background-color: var(--color-background);
}
</style>
