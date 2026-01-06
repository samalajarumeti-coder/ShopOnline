<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { RefreshCw, Plus, Minus, ShoppingBag } from "lucide-vue-next";
import { useFrequentlyBought } from "../composables/useFrequentlyBought";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";
import { useHaptic } from "../composables/useHaptic";
import LazyImage from "./LazyImage.vue";

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const haptic = useHaptic();

const { topProducts, loading, fetchFrequentlyBought, reorderAll } =
  useFrequentlyBought();

// Get quantity in cart
const getQuantity = (productId) => {
  const item = cartStore.items.find((i) => i.id === productId);
  return item ? item.quantity : 0;
};

// Add to cart
const handleAdd = (product) => {
  haptic.light();
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
  });
};

// Remove from cart
const handleRemove = (productId) => {
  haptic.light();
  const qty = getQuantity(productId);
  cartStore.updateQuantity(productId, qty - 1);
};

// Reorder all
const handleReorderAll = () => {
  haptic.medium();
  reorderAll();
};

// Go to product detail
const goToProduct = (productId) => {
  router.push(`/customer/product/${productId}`);
};

// Show section only if logged in and has products
const showSection = computed(() => {
  return authStore.isLoggedIn && topProducts.value.length > 0;
});

onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchFrequentlyBought();
  }
});
</script>

<template>
  <div v-if="showSection" class="px-4 pt-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <RefreshCw class="w-4 h-4 text-purple-600" />
        <h2 class="font-semibold text-gray-800 text-sm">สินค้าที่ซื้อบ่อย</h2>
      </div>
      <button
        @click="handleReorderAll"
        class="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-xs rounded-full touch-feedback"
      >
        <ShoppingBag class="w-3 h-3" />
        <span>สั่งทั้งหมด</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-shrink-0 w-32 bg-gray-100 rounded-xl p-3 animate-pulse"
      >
        <div class="w-full h-20 bg-gray-200 rounded-lg mb-2" />
        <div class="h-3 bg-gray-200 rounded w-3/4 mb-1" />
        <div class="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>

    <!-- Products Horizontal Scroll -->
    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
    >
      <div
        v-for="product in topProducts"
        :key="product.id"
        class="flex-shrink-0 w-32 bg-white rounded-xl shadow-sm overflow-hidden touch-feedback"
      >
        <!-- Product Image -->
        <div class="relative cursor-pointer" @click="goToProduct(product.id)">
          <LazyImage
            :src="product.image"
            :alt="product.name"
            class="w-full h-20"
          />
          <div
            class="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
          >
            <RefreshCw class="w-2 h-2" />
            {{ product.purchase_count }}x
          </div>
        </div>

        <!-- Product Info -->
        <div class="p-2">
          <p class="text-[11px] text-gray-700 line-clamp-1 mb-1">
            {{ product.name }}
          </p>
          <div class="flex items-center justify-between">
            <p class="text-[#007f3e] font-bold text-xs">฿{{ product.price }}</p>
            <button
              v-if="getQuantity(product.id) === 0"
              @click.stop="handleAdd(product)"
              class="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center"
            >
              <Plus class="w-3 h-3" />
            </button>
            <div v-else class="flex items-center" @click.stop>
              <button
                @click="handleRemove(product.id)"
                class="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <Minus class="w-2.5 h-2.5 text-gray-600" />
              </button>
              <span class="w-4 text-center font-bold text-[10px]">{{
                getQuantity(product.id)
              }}</span>
              <button
                @click="handleAdd(product)"
                class="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <Plus class="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          </div>
        </div>
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
