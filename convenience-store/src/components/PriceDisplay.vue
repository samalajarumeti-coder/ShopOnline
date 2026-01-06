<script setup>
import { computed } from "vue";

const props = defineProps({
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    default: null,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
  },
  showCurrency: {
    type: Boolean,
    default: true,
  },
});

const hasDiscount = computed(() => {
  return props.originalPrice && props.originalPrice > props.price;
});

const discountPercentage = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round(
    ((props.originalPrice - props.price) / props.originalPrice) * 100
  );
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      price: "text-sm",
      original: "text-xs",
      currency: "text-xs",
    },
    md: {
      price: "text-lg",
      original: "text-sm",
      currency: "text-sm",
    },
    lg: {
      price: "text-2xl",
      original: "text-base",
      currency: "text-base",
    },
    xl: {
      price: "text-3xl",
      original: "text-lg",
      currency: "text-lg",
    },
  };
  return sizes[props.size] || sizes.md;
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <!-- Current Price -->
    <div class="flex items-baseline gap-1">
      <span
        v-if="showCurrency"
        class="font-medium text-gray-700"
        :class="sizeClasses.currency"
      >
        ฿
      </span>
      <span
        class="font-bold"
        :class="[
          sizeClasses.price,
          hasDiscount ? 'text-red-500' : 'text-gray-900',
        ]"
      >
        {{ formatPrice(price) }}
      </span>
    </div>

    <!-- Original Price (if discounted) -->
    <div v-if="hasDiscount" class="flex items-center gap-2">
      <span class="text-gray-400 line-through" :class="sizeClasses.original">
        ฿{{ formatPrice(originalPrice) }}
      </span>
      <span
        class="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium"
      >
        -{{ discountPercentage }}%
      </span>
    </div>
  </div>
</template>
