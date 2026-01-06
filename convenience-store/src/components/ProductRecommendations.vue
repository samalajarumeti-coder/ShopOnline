<script setup>
import { onMounted } from "vue";
import { Sparkles } from "lucide-vue-next";
import { useRecommendations } from "../composables/useRecommendations";
import ProductCard from "./ProductCard.vue";

const props = defineProps({
  currentProductId: {
    type: [String, Number],
    default: null,
  },
  title: {
    type: String,
    default: "แนะนำสำหรับคุณ",
  },
  enableQuickView: {
    type: Boolean,
    default: true,
  },
  enableWishlist: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["quick-view"]);

const { recommendations, loading, generateRecommendations } =
  useRecommendations();

onMounted(() => {
  generateRecommendations(props.currentProductId);
});

const handleQuickView = (product) => {
  emit("quick-view", product);
};
</script>

<template>
  <div v-if="recommendations.length > 0 || loading" class="px-4 pt-4">
    <div class="flex items-center gap-2 mb-3">
      <Sparkles class="w-4 h-4 text-purple-600" />
      <h3 class="font-semibold text-gray-800 text-sm">{{ title }}</h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div
        v-for="i in 3"
        :key="i"
        class="flex-shrink-0 w-32 h-44 bg-gray-100 rounded-xl animate-pulse"
      />
    </div>

    <!-- Recommendations -->
    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
    >
      <div
        v-for="product in recommendations"
        :key="product.id"
        class="flex-shrink-0 w-32"
      >
        <ProductCard
          :product="product"
          :enable-quick-view="false"
          :enable-wishlist="enableWishlist"
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
