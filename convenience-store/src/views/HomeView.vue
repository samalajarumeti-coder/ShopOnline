/* Path: / */
<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
  computed,
  defineAsyncComponent,
} from "vue";
import { useProductsStore } from "../stores/products";
import { useOrdersStore } from "../stores/orders";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { usePullToRefresh } from "../composables/usePullToRefresh";
import BannerCarousel from "../components/BannerCarousel.vue";
import QuickCategories from "../components/QuickCategories.vue";
import FlashSale from "../components/FlashSale.vue";
import ProductCard from "../components/ProductCard.vue";
import SkeletonLoader from "../components/SkeletonLoader.vue";
import {
  Package,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  TrendingUp,
} from "lucide-vue-next";

// Lazy load non-critical components
const ProductQuickView = defineAsyncComponent(() =>
  import("../components/ProductQuickView.vue")
);
const ProductRecommendations = defineAsyncComponent(() =>
  import("../components/ProductRecommendations.vue")
);
const RecentlyViewed = defineAsyncComponent(() =>
  import("../components/RecentlyViewed.vue")
);
const FrequentlyBought = defineAsyncComponent(() =>
  import("../components/FrequentlyBought.vue")
);
const DealOfTheDay = defineAsyncComponent(() =>
  import("../components/DealOfTheDay.vue")
);

const productsStore = useProductsStore();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();
const cartStore = useCartStore();
const initialLoading = ref(true);

// Greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "สวัสดีตอนเช้า";
  if (hour < 17) return "สวัสดีตอนบ่าย";
  if (hour < 21) return "สวัสดีตอนเย็น";
  return "สวัสดีตอนค่ำ";
});

// User display name
const userName = computed(() => {
  if (authStore.isLoggedIn && authStore.profile?.full_name) {
    return authStore.profile.full_name.split(" ")[0];
  }
  return "";
});

// Quick View
const showQuickView = ref(false);
const quickViewProduct = ref(null);

// Get latest active order
const latestActiveOrder = computed(() => {
  return ordersStore.orders.find((o) =>
    ["pending", "confirmed", "preparing", "delivering"].includes(o.status)
  );
});

const statusConfig = {
  pending: { label: "รอยืนยัน", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "ยืนยันแล้ว", icon: CheckCircle, color: "bg-blue-500" },
  preparing: { label: "กำลังเตรียม", icon: Package, color: "bg-orange-500" },
  delivering: { label: "กำลังจัดส่ง", icon: Truck, color: "bg-purple-500" },
};

// Optimized data refresh - uses cache
const refreshData = async (forceRefresh = false) => {
  const promises = [productsStore.fetchAllHomeData(forceRefresh)];

  if (authStore.isLoggedIn) {
    promises.push(ordersStore.fetchOrders());
  }

  await Promise.all(promises);
};

const { pullDistance, isRefreshing } = usePullToRefresh(() =>
  refreshData(true)
);

const handleQuickView = (product) => {
  quickViewProduct.value = product;
  showQuickView.value = true;
};

onMounted(async () => {
  // Initialize realtime subscriptions
  productsStore.initRealtimeSubscriptions();

  // Fetch data (will use cache if available)
  await refreshData();
  initialLoading.value = false;
});

onUnmounted(() => {
  // Keep realtime connected for better UX
  // productsStore.unsubscribeAll();
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <!-- Pull to Refresh Indicator -->
    <div
      v-if="pullDistance > 0 || isRefreshing"
      class="flex justify-center items-center transition-all duration-200 overflow-hidden"
      :style="{ height: `${Math.max(pullDistance, isRefreshing ? 50 : 0)}px` }"
    >
      <div
        class="w-6 h-6 border-2 border-[#007f3e] border-t-transparent rounded-full"
        :class="isRefreshing ? 'animate-spin' : ''"
        :style="{ transform: `rotate(${pullDistance * 3}deg)` }"
      />
    </div>

    <!-- Skeleton Loading State -->
    <template v-if="initialLoading">
      <!-- Welcome Skeleton -->
      <div class="px-4 pt-3 pb-2">
        <div class="h-6 bg-gray-200 rounded w-48 mb-1 animate-pulse" />
        <div class="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      <!-- Banner Skeleton -->
      <div class="pt-2">
        <SkeletonLoader type="banner" />
      </div>

      <!-- Categories Skeleton -->
      <div class="px-4 py-4">
        <div class="grid grid-cols-4 gap-3">
          <SkeletonLoader type="category" :count="4" />
        </div>
      </div>

      <!-- Flash Sale Skeleton -->
      <div class="px-4 py-4">
        <div class="h-6 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
        <div class="flex gap-3 overflow-hidden">
          <SkeletonLoader type="flash-sale" :count="3" />
        </div>
      </div>

      <!-- Products Skeleton -->
      <div class="px-4 pb-4">
        <div class="h-6 bg-gray-200 rounded w-28 mb-3 animate-pulse" />
        <div class="grid grid-cols-2 gap-3">
          <SkeletonLoader type="card" :count="4" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Welcome Section - Compact -->
      <div class="px-4 pt-3 pb-2">
        <p class="text-base text-gray-800">
          <span class="font-semibold">{{ greeting }}</span>
          <span v-if="userName" class="text-gray-600">, {{ userName }}</span>
        </p>
      </div>

      <!-- Active Order Banner -->
      <div v-if="latestActiveOrder" class="px-4 mb-3">
        <router-link
          :to="`/customer/order/${latestActiveOrder.id}`"
          class="block bg-[#007f3e] rounded-xl p-3 text-white touch-feedback"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
              >
                <component
                  :is="statusConfig[latestActiveOrder.status]?.icon || Package"
                  class="w-4 h-4"
                />
              </div>
              <div>
                <p class="text-sm font-medium">
                  {{
                    statusConfig[latestActiveOrder.status]?.label ||
                    latestActiveOrder.status
                  }}
                </p>
                <p class="text-xs opacity-75">
                  #{{ String(latestActiveOrder.id).slice(0, 8) }}
                </p>
              </div>
            </div>
            <ChevronRight class="w-5 h-5 opacity-80" />
          </div>
        </router-link>
      </div>

      <!-- Banner Carousel -->
      <div class="px-4 pt-1">
        <BannerCarousel :banners="productsStore.banners" />
      </div>

      <!-- Quick Categories -->
      <QuickCategories :categories="productsStore.categories" />

      <!-- Flash Sale -->
      <FlashSale :products="productsStore.flashSaleProducts" />

      <!-- Deal of the Day -->
      <Suspense>
        <DealOfTheDay />
        <template #fallback>
          <div class="px-4 py-4">
            <div
              class="h-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl animate-pulse"
            />
          </div>
        </template>
      </Suspense>

      <!-- Recently Viewed (Lazy) -->
      <Suspense>
        <RecentlyViewed @quick-view="handleQuickView" />
        <template #fallback>
          <div class="px-4 pt-4">
            <div class="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </template>
      </Suspense>

      <!-- Frequently Bought (Lazy) -->
      <Suspense>
        <FrequentlyBought />
        <template #fallback>
          <div class="px-4 pt-4">
            <div class="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </template>
      </Suspense>

      <!-- Recommendations (Lazy) -->
      <Suspense>
        <ProductRecommendations
          title="แนะนำสำหรับคุณ"
          :enable-quick-view="true"
          :enable-wishlist="true"
          @quick-view="handleQuickView"
        />
        <template #fallback>
          <div class="px-4 pt-4">
            <div class="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </template>
      </Suspense>

      <!-- Product Grid -->
      <div class="px-4 pt-4 pb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-[#007f3e]" />
            สินค้าแนะนำ
          </h2>
          <router-link
            to="/customer/categories"
            class="text-sm text-[#007f3e] flex items-center gap-0.5"
          >
            ดูทั้งหมด
            <ChevronRight class="w-4 h-4" />
          </router-link>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <ProductCard
            v-for="product in productsStore.products"
            :key="product.id"
            :product="product"
            :enable-quick-view="true"
            :enable-wishlist="true"
            @quick-view="handleQuickView"
          />
        </div>
      </div>

      <!-- Cart Summary (Fixed at bottom when has items) -->
      <Transition name="slide-up">
        <div
          v-if="cartStore.totalItems > 0"
          class="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-40"
        >
          <router-link
            to="/customer/cart"
            class="flex items-center justify-between bg-[#007f3e] text-white rounded-xl p-3 shadow-lg touch-feedback"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              >
                <span class="font-bold">{{ cartStore.totalItems }}</span>
              </div>
              <span class="font-medium">ดูตะกร้าสินค้า</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold"
                >฿{{ cartStore.totalPrice.toLocaleString() }}</span
              >
              <ChevronRight class="w-5 h-5" />
            </div>
          </router-link>
        </div>
      </Transition>
    </template>

    <!-- Quick View Modal (Lazy) -->
    <Suspense v-if="quickViewProduct">
      <ProductQuickView
        :product="quickViewProduct"
        :show="showQuickView"
        @close="showQuickView = false"
        @view-full="(id) => $router.push(`/customer/product/${id}`)"
      />
    </Suspense>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
