/* Path: /promotions */
<script setup>
import { onMounted, ref } from "vue";
import { useProductsStore } from "../stores/products";
import ProductCard from "../components/ProductCard.vue";
import SkeletonLoader from "../components/SkeletonLoader.vue";
import { Percent, Tag } from "lucide-vue-next";

const productsStore = useProductsStore();
const initialLoading = ref(true);

onMounted(async () => {
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts();
  }
  initialLoading.value = false;
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <div class="px-4 py-4">
      <!-- Header Banner -->
      <div
        class="bg-gradient-to-r from-[#f27220] to-[#ff9a5a] rounded-xl p-4 mb-4 text-white"
      >
        <div class="flex items-center gap-2 mb-1">
          <Percent class="w-6 h-6" />
          <h1 class="text-xl font-bold">โปรโมชั่นพิเศษ</h1>
        </div>
        <p class="text-sm opacity-90">รวมสินค้าลดราคาสุดคุ้ม!</p>
      </div>

      <!-- Skeleton Loading -->
      <div v-if="initialLoading" class="grid grid-cols-2 gap-3">
        <SkeletonLoader type="card" :count="6" />
      </div>

      <!-- Products Grid -->
      <div
        v-else-if="productsStore.promoProducts.length > 0"
        class="grid grid-cols-2 gap-3"
      >
        <ProductCard
          v-for="product in productsStore.promoProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-16">
        <div
          class="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4"
        >
          <Tag class="w-10 h-10 text-orange-200" />
        </div>
        <p class="text-gray-500 text-lg">ไม่มีโปรโมชั่นในขณะนี้</p>
        <p class="text-gray-400 text-sm mt-1">กลับมาเช็คใหม่เร็วๆ นี้</p>
        <router-link to="/customer" class="mt-4 text-[#007f3e] font-medium">
          กลับหน้าหลัก
        </router-link>
      </div>
    </div>
  </div>
</template>
