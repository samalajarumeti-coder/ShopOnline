<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../stores/cart";
import {
  Gift,
  Plus,
  ShoppingCart,
  TrendingDown,
  Sparkles,
  Check,
} from "lucide-vue-next";

const router = useRouter();
const cartStore = useCartStore();

const availableDeals = ref([]);
const loading = ref(false);

// Fetch deals that include products in cart
const fetchCartDeals = async () => {
  if (cartStore.items.length === 0) {
    availableDeals.value = [];
    return;
  }

  loading.value = true;
  try {
    const cartProductIds = cartStore.items.map((item) => item.id);
    const now = new Date().toISOString();

    // Get all active deals
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
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (error) throw error;

    // Filter deals that have at least one product in cart but not all
    const relevantDeals = (data || []).filter((deal) => {
      const dealProductIds =
        deal.bundle_products?.map((bp) => bp.product_id) || [];
      const hasAny = dealProductIds.some((id) => cartProductIds.includes(id));
      const hasAll = dealProductIds.every((id) => cartProductIds.includes(id));
      return hasAny && !hasAll; // Show deals where user has some but not all products
    });

    availableDeals.value = relevantDeals.slice(0, 3); // Limit to 3 deals
  } catch (err) {
    console.error("Failed to fetch cart deals:", err);
    availableDeals.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCartDeals);

// Watch cart changes
watch(() => cartStore.items, fetchCartDeals, { deep: true });

// Helpers
const getOriginalPrice = (deal) => {
  if (!deal.bundle_products) return 0;
  return deal.bundle_products.reduce(
    (sum, bp) => sum + (bp.products?.price || 0) * bp.quantity,
    0
  );
};

const getDealPrice = (deal) => {
  const total = getOriginalPrice(deal);
  if (deal.discount_type === "percentage") {
    return total * (1 - deal.discount_value / 100);
  }
  if (deal.discount_type === "fixed") {
    return Math.max(0, total - deal.discount_value);
  }
  if (deal.discount_type === "special_price") {
    return deal.discount_value;
  }
  return total;
};

const getSavings = (deal) => getOriginalPrice(deal) - getDealPrice(deal);

const isProductInCart = (productId) => {
  return cartStore.items.some((item) => item.id === productId);
};

const getMissingProducts = (deal) => {
  return (
    deal.bundle_products?.filter((bp) => !isProductInCart(bp.product_id)) || []
  );
};

const addMissingToCart = (deal) => {
  const missing = getMissingProducts(deal);
  missing.forEach((bp) => {
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
</script>

<template>
  <div
    v-if="availableDeals.length > 0"
    class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
  >
    <div class="flex items-center gap-2 mb-3">
      <div
        class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
      >
        <Gift class="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 class="font-bold text-green-800">🎁 Deal ที่คุณอาจสนใจ</h3>
        <p class="text-xs text-green-600">เพิ่มสินค้าเพื่อรับส่วนลดพิเศษ!</p>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="deal in availableDeals"
        :key="deal.id"
        class="bg-white rounded-lg p-3 shadow-sm"
      >
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-gray-800 text-sm">{{ deal.name }}</h4>
          <span
            class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
          >
            <TrendingDown class="w-3 h-3" />
            ประหยัด ฿{{ getSavings(deal).toFixed(0) }}
          </span>
        </div>

        <!-- Products in deal -->
        <div class="flex items-center gap-1 mb-3 flex-wrap">
          <div
            v-for="(bp, index) in deal.bundle_products"
            :key="bp.product_id"
            class="flex items-center"
          >
            <div
              @click="viewProduct(bp.products?.id)"
              class="relative cursor-pointer"
            >
              <img
                :src="bp.products?.image || '/placeholder-product.svg'"
                :alt="bp.products?.name"
                :class="[
                  'w-10 h-10 rounded-lg object-cover border-2 transition-all',
                  isProductInCart(bp.product_id)
                    ? 'border-green-500 opacity-100'
                    : 'border-orange-400 opacity-70 ring-2 ring-orange-200',
                ]"
              />
              <!-- Check mark for items in cart -->
              <div
                v-if="isProductInCart(bp.product_id)"
                class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check class="w-3 h-3 text-white" />
              </div>
              <!-- Plus badge for missing items -->
              <div
                v-else
                class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse"
              >
                <Plus class="w-3 h-3 text-white" />
              </div>
            </div>
            <span
              v-if="index < deal.bundle_products.length - 1"
              class="text-gray-300 mx-0.5"
              >+</span
            >
          </div>
        </div>

        <!-- Missing products hint -->
        <div v-if="getMissingProducts(deal).length > 0" class="mb-2">
          <p class="text-xs text-orange-600">
            เพิ่มอีก {{ getMissingProducts(deal).length }} รายการ:
            <span class="font-medium">
              {{
                getMissingProducts(deal)
                  .map((bp) => bp.products?.name)
                  .join(", ")
              }}
            </span>
          </p>
        </div>

        <!-- Action -->
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <span class="text-gray-400 line-through"
              >฿{{ getOriginalPrice(deal).toFixed(0) }}</span
            >
            <span class="text-green-600 font-bold ml-2"
              >฿{{ getDealPrice(deal).toFixed(0) }}</span
            >
          </div>
          <button
            @click="addMissingToCart(deal)"
            class="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
          >
            <Plus class="w-3 h-3" />
            เพิ่มที่ขาด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
