<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../stores/cart";
import {
  Gift,
  Clock,
  ShoppingCart,
  Sparkles,
  TrendingDown,
} from "lucide-vue-next";

const router = useRouter();
const cartStore = useCartStore();

const deal = ref(null);
const loading = ref(true);
const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 });
let timerInterval = null;

// Get today's deal (random active deal or featured)
const fetchDealOfTheDay = async () => {
  loading.value = true;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("product_bundles")
      .select(
        `
        *,
        bundle_products (
          quantity,
          is_required,
          product_id,
          products (id, name, name_en, price, image, stock)
        )
      `
      )
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    // Pick one deal (could be random or first)
    if (data && data.length > 0) {
      // Use date-based seed for consistent daily deal
      const today = new Date().toDateString();
      const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const index = seed % data.length;
      deal.value = data[index];
    }
  } catch (err) {
    console.error("Failed to fetch deal of the day:", err);
  } finally {
    loading.value = false;
  }
};

// Calculate countdown to midnight
const updateTimer = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  // If deal has end_date, use that instead
  const endTime = deal.value?.end_date
    ? new Date(deal.value.end_date)
    : midnight;
  const diff = Math.max(0, endTime - now);

  timeLeft.value = {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

onMounted(async () => {
  await fetchDealOfTheDay();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Computed
const originalPrice = computed(() => {
  if (!deal.value?.bundle_products) return 0;
  return deal.value.bundle_products.reduce(
    (sum, bp) => sum + (bp.products?.price || 0) * bp.quantity,
    0
  );
});

const dealPrice = computed(() => {
  if (!deal.value) return 0;
  const total = originalPrice.value;
  if (deal.value.discount_type === "percentage") {
    return total * (1 - deal.value.discount_value / 100);
  }
  if (deal.value.discount_type === "fixed") {
    return Math.max(0, total - deal.value.discount_value);
  }
  if (deal.value.discount_type === "special_price") {
    return deal.value.discount_value;
  }
  return total;
});

const savings = computed(() => originalPrice.value - dealPrice.value);

const discountLabel = computed(() => {
  if (!deal.value) return "";
  if (deal.value.discount_type === "percentage")
    return `-${deal.value.discount_value}%`;
  return `ประหยัด ฿${savings.value.toFixed(0)}`;
});

// Methods
const addDealToCart = () => {
  if (!deal.value?.bundle_products) return;
  deal.value.bundle_products.forEach((bp) => {
    if (bp.products) {
      for (let i = 0; i < bp.quantity; i++) {
        cartStore.addToCart(bp.products);
      }
    }
  });
};

const viewProduct = (productId) => {
  router.push(`/customer/product/${productId}`);
};

const pad = (n) => String(n).padStart(2, "0");
</script>

<template>
  <div
    v-if="deal && !loading"
    class="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl p-4 mx-4 my-4 shadow-lg overflow-hidden relative"
  >
    <!-- Sparkle decorations -->
    <div class="absolute top-2 right-2 opacity-30">
      <Sparkles class="w-8 h-8 text-white animate-pulse" />
    </div>
    <div class="absolute bottom-2 left-2 opacity-20">
      <Sparkles
        class="w-6 h-6 text-white animate-pulse"
        style="animation-delay: 0.5s"
      />
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div
          class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
        >
          <Gift class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-white font-bold text-lg">🎁 Deal of the Day</h3>
          <p class="text-white/80 text-xs">ดีลพิเศษประจำวัน</p>
        </div>
      </div>

      <!-- Countdown -->
      <div class="bg-black/30 rounded-lg px-3 py-2">
        <div class="flex items-center gap-1 text-white">
          <Clock class="w-4 h-4" />
          <span class="font-mono font-bold text-sm">
            {{ pad(timeLeft.hours) }}:{{ pad(timeLeft.minutes) }}:{{
              pad(timeLeft.seconds)
            }}
          </span>
        </div>
        <p class="text-white/70 text-[10px] text-center">เหลือเวลา</p>
      </div>
    </div>

    <!-- Deal Content -->
    <div class="bg-white rounded-xl p-3">
      <div class="flex items-center gap-2 mb-2">
        <span
          class="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full"
        >
          {{ discountLabel }}
        </span>
        <h4 class="font-bold text-gray-800 flex-1 truncate">{{ deal.name }}</h4>
      </div>

      <!-- Products -->
      <div
        class="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide"
      >
        <div
          v-for="(bp, index) in deal.bundle_products"
          :key="bp.product_id"
          class="flex items-center"
        >
          <div
            @click="viewProduct(bp.products?.id)"
            class="relative flex-shrink-0 cursor-pointer"
          >
            <img
              :src="bp.products?.image || '/placeholder-product.svg'"
              :alt="bp.products?.name"
              class="w-14 h-14 rounded-lg object-cover border-2 border-gray-100 hover:border-purple-400 transition-colors"
            />
            <span
              v-if="bp.quantity > 1"
              class="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {{ bp.quantity }}
            </span>
          </div>
          <span
            v-if="index < deal.bundle_products.length - 1"
            class="text-purple-400 font-bold mx-1"
            >+</span
          >
        </div>
      </div>

      <!-- Price & Action -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold text-purple-600"
              >฿{{ dealPrice.toFixed(0) }}</span
            >
            <span class="text-gray-400 line-through text-sm"
              >฿{{ originalPrice.toFixed(0) }}</span
            >
          </div>
          <div class="flex items-center gap-1 text-green-600 text-xs">
            <TrendingDown class="w-3 h-3" />
            <span>ประหยัด ฿{{ savings.toFixed(0) }}</span>
          </div>
        </div>

        <button
          @click="addDealToCart"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-lg"
        >
          <ShoppingCart class="w-4 h-4" />
          เพิ่มทั้งหมด
        </button>
      </div>
    </div>
  </div>

  <!-- Loading Skeleton -->
  <div
    v-else-if="loading"
    class="bg-gradient-to-r from-purple-600/50 to-pink-500/50 rounded-2xl p-4 mx-4 my-4 animate-pulse"
  >
    <div class="h-10 bg-white/20 rounded mb-3"></div>
    <div class="bg-white/50 rounded-xl p-3">
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div class="flex gap-2 mb-3">
        <div class="w-14 h-14 bg-gray-200 rounded-lg"></div>
        <div class="w-14 h-14 bg-gray-200 rounded-lg"></div>
        <div class="w-14 h-14 bg-gray-200 rounded-lg"></div>
      </div>
      <div class="h-10 bg-gray-200 rounded"></div>
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
