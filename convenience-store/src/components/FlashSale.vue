<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { Zap, Plus, Minus } from "lucide-vue-next";
import { useCartStore } from "../stores/cart";
import { useProductsStore } from "../stores/products";
import { useHaptic } from "../composables/useHaptic";
import LazyImage from "./LazyImage.vue";

const props = defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});

const cartStore = useCartStore();
const productsStore = useProductsStore();
const haptic = useHaptic();

// ดึงจำนวนสินค้าในตะกร้า
const getQuantity = (productId) => {
  const item = cartStore.items.find((item) => item.id === productId);
  return item ? item.quantity : 0;
};

// เพิ่มสินค้า
const handleAdd = (product) => {
  haptic.light();
  cartStore.addToCart(product);
};

// ลดสินค้า
const handleRemove = (productId) => {
  haptic.light();
  const qty = getQuantity(productId);
  cartStore.updateQuantity(productId, qty - 1);
};

// Countdown timer - uses end_time from store settings
const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 });

const updateTimer = () => {
  const now = new Date();
  // Use end_time from store, fallback to midnight
  let end = productsStore.flashSaleEndTime
    ? new Date(productsStore.flashSaleEndTime)
    : null;
  if (!end || isNaN(end.getTime())) {
    end = new Date();
    end.setHours(24, 0, 0, 0);
  }

  const diff = Math.max(0, end - now);
  timeLeft.value = {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

let interval = null;
onMounted(() => {
  updateTimer();
  // Update every second for accurate countdown
  interval = setInterval(updateTimer, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const pad = (n) => String(n).padStart(2, "0");

const getDiscount = (product) => {
  if (!product.original_price) return 0;
  return Math.round(
    ((product.original_price - product.price) / product.original_price) * 100
  );
};
</script>

<template>
  <div v-if="products.length > 0" class="py-3">
    <!-- Header -->
    <div class="px-4 flex items-center justify-between mb-2">
      <div class="flex items-center gap-1.5">
        <Zap class="w-4 h-4 text-[#f27220] fill-[#f27220]" />
        <h2 class="font-semibold text-gray-800 text-sm">Flash Sale</h2>
      </div>

      <!-- Timer - Optimized with CSS animation for seconds -->
      <div class="flex items-center gap-1 text-xs">
        <span class="text-gray-400">จบใน</span>
        <div class="flex items-center gap-0.5">
          <span
            class="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono text-[10px] min-w-[22px] text-center"
          >
            {{ pad(timeLeft.hours) }}
          </span>
          <span class="text-gray-400 timer-colon">:</span>
          <span
            class="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono text-[10px] min-w-[22px] text-center"
          >
            {{ pad(timeLeft.minutes) }}
          </span>
          <span class="text-gray-400 timer-colon">:</span>
          <span
            class="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono text-[10px] min-w-[22px] text-center timer-seconds"
          >
            {{ pad(timeLeft.seconds) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Horizontal Scroll -->
    <div class="flex gap-2.5 overflow-x-auto pb-1 px-4 scrollbar-hide snap-x">
      <router-link
        v-for="product in products"
        :key="product.id"
        :to="`/customer/product/${product.id}`"
        class="flex-shrink-0 w-28 bg-white rounded-xl overflow-hidden snap-start touch-feedback shadow-sm"
      >
        <div class="relative">
          <LazyImage
            :src="product.image"
            :alt="product.name"
            class="w-full h-24"
          />
          <span
            class="absolute top-1 left-1 bg-[#f27220] text-white text-[9px] font-bold px-1.5 py-0.5 rounded"
          >
            -{{ getDiscount(product) }}%
          </span>
        </div>
        <div class="p-2">
          <p class="text-[11px] text-gray-700 line-clamp-1 mb-1">
            {{ product.name }}
          </p>
          <div class="flex items-end justify-between">
            <div>
              <p class="text-[#007f3e] font-bold text-xs">
                ฿{{ product.price }}
              </p>
              <p class="text-gray-400 text-[9px] line-through">
                ฿{{ product.original_price }}
              </p>
            </div>
            <!-- Add Button -->
            <div
              v-if="getQuantity(product.id) > 0"
              class="flex items-center"
              @click.prevent
            >
              <button
                @click.prevent="handleRemove(product.id)"
                class="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"
              >
                <Minus class="w-2.5 h-2.5 text-gray-600" />
              </button>
              <span class="w-4 text-center font-bold text-[10px]">{{
                getQuantity(product.id)
              }}</span>
              <button
                @click.prevent="handleAdd(product)"
                class="w-5 h-5 bg-[#007f3e] rounded-full flex items-center justify-center"
              >
                <Plus class="w-2.5 h-2.5 text-white" />
              </button>
            </div>
            <button
              v-else
              @click.prevent="handleAdd(product)"
              class="w-6 h-6 bg-[#007f3e] rounded-full flex items-center justify-center"
            >
              <Plus class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </router-link>
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

/* Colon blink animation */
.timer-colon {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Subtle pulse for seconds to indicate it's counting */
.timer-seconds {
  animation: pulse-subtle 1s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}
</style>
