<script setup>
import { computed } from "vue";
import {
  UtensilsCrossed,
  Coffee,
  Sparkles,
  Home,
  Cookie,
  Grid3X3,
} from "lucide-vue-next";

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
});

const iconMap = {
  UtensilsCrossed,
  Coffee,
  Sparkles,
  Home,
  Cookie,
  Grid3X3,
};

const displayCategories = computed(() => props.categories);
</script>

<template>
  <div class="px-4 py-4">
    <div class="grid grid-cols-4 gap-4">
      <router-link
        v-for="category in displayCategories"
        :key="category.id"
        :to="`/customer/categories?cat=${category.id}`"
        class="flex flex-col items-center gap-2 touch-feedback"
      >
        <div
          class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"
        >
          <component
            :is="iconMap[category.icon]"
            class="w-6 h-6 text-[#007f3e]"
          />
        </div>
        <span
          class="text-[11px] text-gray-600 text-center leading-tight line-clamp-1"
        >
          {{ category.name }}
        </span>
      </router-link>
    </div>
  </div>
</template>
