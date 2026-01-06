/* Path: /wishlist */
<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useWishlistStore } from "../stores/wishlist";
import { ArrowLeft, Heart, Clock, Trash2, ShoppingBag } from "lucide-vue-next";
import ProductCard from "../components/ProductCard.vue";

const router = useRouter();
const wishlistStore = useWishlistStore();

// Active tab
const activeTab = ref("wishlist");

onMounted(async () => {
  await Promise.all([
    wishlistStore.fetchWishlistProducts(),
    wishlistStore.fetchRecentlyViewed(),
  ]);
});

const isEmpty = computed(() => {
  if (activeTab.value === "wishlist") {
    return wishlistStore.wishlistProducts.length === 0;
  }
  return wishlistStore.recentlyViewedProducts.length === 0;
});

const clearList = () => {
  if (activeTab.value === "wishlist") {
    wishlistStore.clearWishlist();
  } else {
    wishlistStore.clearRecentlyViewed();
  }
};
</script>

<script>
import { ref } from "vue";
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <header class="bg-white sticky top-0 z-10 shadow-sm">
      <div class="flex items-center gap-4 p-4">
        <button
          @click="router.back()"
          class="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-all"
        >
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="text-lg font-bold flex-1">รายการของฉัน</h1>
      </div>

      <!-- Tabs -->
      <div class="flex border-b">
        <button
          @click="activeTab = 'wishlist'"
          class="flex-1 py-3 text-center font-medium transition-colors relative"
          :class="activeTab === 'wishlist' ? 'text-green-700' : 'text-gray-500'"
        >
          <div class="flex items-center justify-center gap-2">
            <Heart class="w-4 h-4" />
            <span>รายการโปรด</span>
            <span
              v-if="wishlistStore.wishlistCount > 0"
              class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full"
            >
              {{ wishlistStore.wishlistCount }}
            </span>
          </div>
          <div
            v-if="activeTab === 'wishlist'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700"
          ></div>
        </button>
        <button
          @click="activeTab = 'recent'"
          class="flex-1 py-3 text-center font-medium transition-colors relative"
          :class="activeTab === 'recent' ? 'text-green-700' : 'text-gray-500'"
        >
          <div class="flex items-center justify-center gap-2">
            <Clock class="w-4 h-4" />
            <span>ดูล่าสุด</span>
            <span
              v-if="wishlistStore.recentlyViewedCount > 0"
              class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
            >
              {{ wishlistStore.recentlyViewedCount }}
            </span>
          </div>
          <div
            v-if="activeTab === 'recent'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700"
          ></div>
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="wishlistStore.loading" class="p-4">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-xl p-3 animate-pulse"
        >
          <div class="aspect-square bg-gray-200 rounded-lg mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-5 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center py-20 px-4"
    >
      <div
        class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <Heart
          v-if="activeTab === 'wishlist'"
          class="w-12 h-12 text-gray-300"
        />
        <Clock v-else class="w-12 h-12 text-gray-300" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 mb-2">
        {{
          activeTab === "wishlist"
            ? "ยังไม่มีรายการโปรด"
            : "ยังไม่มีประวัติการดู"
        }}
      </h3>
      <p class="text-gray-500 text-center mb-6">
        {{
          activeTab === "wishlist"
            ? "กดไอคอนหัวใจเพื่อบันทึกสินค้าที่ชอบ"
            : "สินค้าที่คุณเคยดูจะแสดงที่นี่"
        }}
      </p>
      <button
        @click="router.push('/customer')"
        class="px-6 py-3 bg-green-700 text-white rounded-xl font-medium flex items-center gap-2"
      >
        <ShoppingBag class="w-5 h-5" />
        เลือกซื้อสินค้า
      </button>
    </div>

    <!-- Product Grid -->
    <div v-else class="p-4">
      <!-- Clear Button -->
      <div class="flex justify-end mb-3">
        <button
          @click="clearList"
          class="text-sm text-red-500 flex items-center gap-1 hover:text-red-600"
        >
          <Trash2 class="w-4 h-4" />
          ล้างทั้งหมด
        </button>
      </div>

      <!-- Wishlist Products -->
      <div v-if="activeTab === 'wishlist'" class="grid grid-cols-2 gap-3">
        <ProductCard
          v-for="product in wishlistStore.wishlistProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- Recently Viewed Products -->
      <div v-else class="grid grid-cols-2 gap-3">
        <ProductCard
          v-for="product in wishlistStore.recentlyViewedProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </div>
</template>
