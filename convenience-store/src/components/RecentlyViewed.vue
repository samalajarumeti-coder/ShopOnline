<script setup>
import { Clock } from "lucide-vue-next";
import { useRecentlyViewed } from "../composables/useRecentlyViewed";
import ProductCard from "./ProductCard.vue";

const emit = defineEmits(["quick-view"]);

const { recentlyViewedProducts, loading, clear } = useRecentlyViewed();

const handleQuickView = (product) => {
  emit("quick-view", product);
};
</script>

<template>
  <div v-if="recentlyViewedProducts.length > 0" class="px-4 pt-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-gray-500" />
        <h3 class="font-semibold text-gray-800 text-sm">
          เพิ่งดูไปเมื่อสักครู่
        </h3>
      </div>
      <button @click="clear" class="text-xs text-gray-400">ล้าง</button>
    </div>

    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-shrink-0 w-32 h-44 bg-gray-100 rounded-xl animate-pulse"
      />
    </div>

    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
    >
      <div
        v-for="product in recentlyViewedProducts"
        :key="product.id"
        class="flex-shrink-0 w-32"
      >
        <ProductCard
          :product="product"
          :enable-quick-view="false"
          @quick-view="handleQuickView"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
