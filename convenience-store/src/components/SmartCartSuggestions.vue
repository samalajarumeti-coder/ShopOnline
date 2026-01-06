<script setup>
import { onMounted, watch } from "vue";
import {
  Sparkles,
  Plus,
  X,
  ShoppingCart,
  Percent,
  Gift,
} from "lucide-vue-next";
import { useSmartCartSuggestions } from "../composables/useSmartCartSuggestions";
import { useCartStore } from "../stores/cart";
import { useHaptic } from "../composables/useHaptic";
import LazyImage from "./LazyImage.vue";

const {
  topSuggestions,
  loading,
  fetchSuggestions,
  dismissSuggestion,
  addToCart,
  getBuyPercentage,
  bundleDealActive,
  bundleDiscount,
  suggestedItemsInCart,
  BUNDLE_DISCOUNT_PERCENT,
  BUNDLE_MIN_ITEMS,
} = useSmartCartSuggestions();

const cartStore = useCartStore();
const haptic = useHaptic();

const handleAddToCart = (product) => {
  haptic.light();
  addToCart(product);
};

const handleDismiss = (productId) => {
  haptic.light();
  dismissSuggestion(productId);
};

onMounted(() => {
  if (cartStore.items.length > 0) {
    fetchSuggestions();
  }
});

watch(
  () => cartStore.items.length,
  (newLen) => {
    if (newLen > 0) {
      fetchSuggestions();
    }
  }
);
</script>

<template>
  <div v-if="topSuggestions.length > 0 || bundleDealActive" class="space-y-3">
    <!-- Bundle Deal Banner -->
    <div
      v-if="bundleDealActive"
      class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg text-white"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Gift class="w-6 h-6" />
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-lg">🎉 Bundle Deal สำเร็จ!</h3>
          <p class="text-sm text-white/90">
            คุณเพิ่มสินค้าแนะนำ {{ suggestedItemsInCart }} ชิ้น
          </p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold">-฿{{ bundleDiscount }}</div>
          <div class="text-xs text-white/80">
            ส่วนลด {{ BUNDLE_DISCOUNT_PERCENT }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Bundle Deal Progress (when not yet active) -->
    <div
      v-else-if="
        suggestedItemsInCart > 0 && suggestedItemsInCart < BUNDLE_MIN_ITEMS
      "
      class="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-3 border-2 border-dashed border-amber-400"
    >
      <div class="flex items-center gap-2">
        <Percent class="w-5 h-5 text-amber-600" />
        <div class="flex-1">
          <p class="text-sm font-medium text-amber-800">
            เพิ่มอีก {{ BUNDLE_MIN_ITEMS - suggestedItemsInCart }} ชิ้น
            รับส่วนลด {{ BUNDLE_DISCOUNT_PERCENT }}%!
          </p>
        </div>
      </div>
    </div>

    <!-- Suggestions Section -->
    <div
      v-if="topSuggestions.length > 0"
      class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm"
    >
      <!-- Header -->
      <div class="flex items-center gap-2 mb-3">
        <div
          class="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
        >
          <Sparkles class="w-4 h-4 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-800 text-sm">แนะนำสำหรับคุณ</h3>
          <p class="text-xs text-gray-500">สินค้าที่มักซื้อคู่กัน</p>
        </div>
        <!-- Bundle hint -->
        <div
          v-if="!bundleDealActive"
          class="bg-amber-200 text-amber-800 text-[10px] px-2 py-1 rounded-full font-medium"
        >
          ซื้อ {{ BUNDLE_MIN_ITEMS }}+ ลด {{ BUNDLE_DISCOUNT_PERCENT }}%
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex gap-3 overflow-x-auto pb-2">
        <div v-for="i in 3" :key="i" class="flex-shrink-0 w-32 animate-pulse">
          <div class="bg-gray-200 rounded-lg h-24 mb-2"></div>
          <div class="bg-gray-200 rounded h-3 mb-1"></div>
          <div class="bg-gray-200 rounded h-3 w-2/3"></div>
        </div>
      </div>

      <!-- Suggestions Grid -->
      <div
        v-else
        class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
      >
        <div
          v-for="product in topSuggestions"
          :key="product.id"
          class="flex-shrink-0 w-32 bg-white rounded-xl p-2 shadow-sm relative group"
        >
          <!-- Dismiss Button -->
          <button
            @click="handleDismiss(product.id)"
            class="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X class="w-3 h-3 text-gray-400" />
          </button>

          <!-- Buy Percentage Badge -->
          <div
            class="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold z-10"
          >
            {{ getBuyPercentage(product) }}% ซื้อคู่
          </div>

          <!-- Product Image -->
          <div class="relative mb-2">
            <LazyImage
              :src="product.image"
              :alt="product.name"
              class="w-full h-20 rounded-lg"
            />
            <!-- Discount Badge -->
            <div
              v-if="
                product.original_price && product.original_price > product.price
              "
              class="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            >
              -{{
                Math.round((1 - product.price / product.original_price) * 100)
              }}%
            </div>
          </div>

          <!-- Product Info -->
          <h4
            class="text-xs font-medium text-gray-800 line-clamp-2 mb-1 leading-tight"
          >
            {{ product.name }}
          </h4>

          <div class="flex items-center justify-between mt-auto">
            <div>
              <span class="text-[#007f3e] font-bold text-sm"
                >฿{{ product.price }}</span
              >
              <span
                v-if="
                  product.original_price &&
                  product.original_price > product.price
                "
                class="text-gray-400 text-[10px] line-through ml-1"
              >
                ฿{{ product.original_price }}
              </span>
            </div>
          </div>

          <!-- Add Button -->
          <button
            @click="handleAddToCart(product)"
            class="w-full mt-2 bg-[#007f3e] text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform"
            :disabled="product.stock === 0"
            :class="{ 'opacity-50 cursor-not-allowed': product.stock === 0 }"
          >
            <Plus class="w-3 h-3" />
            <span>{{ product.stock === 0 ? "หมด" : "เพิ่ม" }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Add All with Bundle Hint -->
      <button
        v-if="topSuggestions.length > 1"
        @click="
          topSuggestions.forEach((p) => p.stock !== 0 && handleAddToCart(p))
        "
        class="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
      >
        <ShoppingCart class="w-4 h-4" />
        เพิ่มทั้งหมด
        {{ topSuggestions.filter((p) => p.stock !== 0).length }} ชิ้น
        <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs">
          รับส่วนลด {{ BUNDLE_DISCOUNT_PERCENT }}%
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
