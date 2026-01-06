/* Path: /categories */
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useProductsStore } from "../stores/products";
import ProductCard from "../components/ProductCard.vue";
import SkeletonLoader from "../components/SkeletonLoader.vue";
import { Package } from "lucide-vue-next";

const route = useRoute();
const productsStore = useProductsStore();
const selectedCategory = ref("all");
const initialLoading = ref(true);

onMounted(async () => {
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts();
  }
  if (productsStore.categories.length === 0) {
    await productsStore.fetchCategories();
  }
  if (route.query.cat) {
    selectedCategory.value = route.query.cat;
  }
  initialLoading.value = false;
});

watch(
  () => route.query.cat,
  (newCat) => {
    if (newCat) selectedCategory.value = newCat;
  }
);

const filteredProducts = computed(() => {
  return productsStore.getProductsByCategory(selectedCategory.value);
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <div class="px-4 py-4">
      <h1 class="text-xl font-bold text-gray-800 mb-4">หมวดหมู่สินค้า</h1>

      <!-- Skeleton Loading -->
      <template v-if="initialLoading">
        <!-- Category Tabs Skeleton -->
        <div class="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
          <div
            v-for="i in 5"
            :key="i"
            class="flex-shrink-0 w-20 h-9 bg-gray-200 rounded-full animate-pulse"
          />
        </div>
        <!-- Products Skeleton -->
        <div class="grid grid-cols-2 gap-3 mt-2">
          <SkeletonLoader type="card" :count="6" />
        </div>
      </template>

      <template v-else>
        <!-- Category Tabs -->
        <div class="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          <button
            v-for="cat in productsStore.categories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            :class="
              selectedCategory === cat.id
                ? 'bg-[#007f3e] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            "
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 gap-3 mt-2">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredProducts.length === 0"
          class="flex flex-col items-center justify-center py-16"
        >
          <div
            class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"
          >
            <Package class="w-10 h-10 text-gray-300" />
          </div>
          <p class="text-gray-500 text-lg">ไม่พบสินค้าในหมวดหมู่นี้</p>
          <button
            @click="selectedCategory = 'all'"
            class="mt-4 text-[#007f3e] font-medium"
          >
            ดูสินค้าทั้งหมด
          </button>
        </div>
      </template>
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
