<script setup>
import { ref, watch, onMounted } from "vue";
import { Plus, Sparkles, TrendingUp, ShoppingBag } from "lucide-vue-next";
import { useSubscriptionRecommendations } from "../composables/useSubscriptionRecommendations";
import { useHaptic } from "../composables/useHaptic";
import LazyImage from "./LazyImage.vue";

const props = defineProps({
  selectedProductIds: {
    type: Array,
    default: () => [],
  },
  maxItems: {
    type: Number,
    default: 6,
  },
});

const emit = defineEmits(["add-product"]);

const { recommendations, loading, getAllRecommendations } =
  useSubscriptionRecommendations();

const haptic = useHaptic();

// Fetch recommendations when selected products change
watch(
  () => props.selectedProductIds,
  async (newIds) => {
    if (newIds?.length > 0) {
      await getAllRecommendations(newIds, props.maxItems);
    }
  },
  { immediate: true, deep: true }
);

// Add product to subscription
const handleAddProduct = (product) => {
  haptic.light();
  emit("add-product", product);
};

// Get discount percentage
const getDiscount = (product) => {
  if (!product.original_price) return 0;
  return Math.round(
    ((product.original_price - product.price) / product.original_price) * 100
  );
};
</script>

<template>
  <div v-if="recommendations.length > 0 || loading" class="mt-4">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <div
        class="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-600" />
      </div>
      <h3 class="text-sm font-medium text-gray-700">แนะนำเพิ่มเติม</h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-shrink-0 w-28 bg-gray-100 rounded-xl p-2 animate-pulse"
      >
        <div class="w-full aspect-square bg-gray-200 rounded-lg mb-2" />
        <div class="h-3 bg-gray-200 rounded w-3/4 mb-1" />
        <div class="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>

    <!-- Recommendations Grid -->
    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      <div
        v-for="(product, index) in recommendations"
        :key="product.id"
        class="flex-shrink-0 w-28 bg-gray-50 rounded-xl overflow-hidden animate-fade-in"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <!-- Product Image -->
        <div class="relative">
          <LazyImage
            :src="product.image"
            :alt="product.name"
            class="w-full aspect-square"
          />

          <!-- Discount Badge -->
          <span
            v-if="product.original_price"
            class="absolute top-1 left-1 bg-[#f27220] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          >
            -{{ getDiscount(product) }}%
          </span>

          <!-- Recommendation Reason Badge -->
          <span
            v-if="product.recommendationReason"
            class="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded text-center truncate"
          >
            {{ product.recommendationReason }}
          </span>
        </div>

        <!-- Product Info -->
        <div class="p-2">
          <p class="text-xs text-gray-700 line-clamp-1 mb-1">
            {{ product.name }}
          </p>

          <div class="flex items-center justify-between">
            <div>
              <p class="text-[#007f3e] font-bold text-xs">
                ฿{{ product.price }}
              </p>
              <p
                v-if="product.original_price"
                class="text-gray-400 text-[10px] line-through"
              >
                ฿{{ product.original_price }}
              </p>
            </div>

            <!-- Add Button -->
            <button
              @click.stop="handleAddProduct(product)"
              class="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all"
            >
              <Plus class="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- View More Card -->
      <div
        v-if="recommendations.length >= props.maxItems"
        class="flex-shrink-0 w-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex flex-col items-center justify-center gap-1 p-2"
      >
        <TrendingUp class="w-5 h-5 text-amber-600" />
        <span class="text-[10px] text-amber-700 font-medium text-center"
          >ดูเพิ่มเติม</span
        >
      </div>
    </div>

    <!-- Quick Add All Button -->
    <button
      v-if="recommendations.length > 0 && !loading"
      @click="recommendations.forEach((p) => handleAddProduct(p))"
      class="mt-3 w-full py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-amber-200 active:scale-[0.98] transition-all"
    >
      <ShoppingBag class="w-4 h-4" />
      เพิ่มทั้งหมด ({{ recommendations.length }} รายการ)
    </button>
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
