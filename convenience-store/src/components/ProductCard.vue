<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Plus, Minus, Heart } from "lucide-vue-next";
import { useCartStore } from "../stores/cart";
import { useWishlistStore } from "../stores/wishlist";
import { useHaptic } from "../composables/useHaptic";
import LazyImage from "./LazyImage.vue";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  enableQuickView: {
    type: Boolean,
    default: false,
  },
  enableWishlist: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["quick-view"]);

const router = useRouter();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const haptic = useHaptic();

// ดึงจำนวนสินค้าในตะกร้า
const quantityInCart = computed(() => {
  const item = cartStore.items.find((item) => item.id === props.product.id);
  return item ? item.quantity : 0;
});

// Check if in wishlist
const isWishlisted = computed(() =>
  wishlistStore.isInWishlist(props.product.id)
);

// เพิ่มสินค้า
const handleAdd = () => {
  haptic.light();
  cartStore.addToCart(props.product);
};

// ลดสินค้า
const handleRemove = () => {
  haptic.light();
  cartStore.updateQuantity(props.product.id, quantityInCart.value - 1);
};

const goToDetail = () => {
  router.push(`/customer/product/${props.product.id}`);
};

const handleQuickView = () => {
  emit("quick-view", props.product);
};

const handleToggleWishlist = () => {
  wishlistStore.toggleWishlist(props.product.id);
  haptic.light();
};

const discountPercent = (product) => {
  if (!product.originalPrice && !product.original_price) return 0;
  const original = product.originalPrice || product.original_price;
  return Math.round(((original - product.price) / original) * 100);
};
</script>

<template>
  <article
    class="bg-white rounded-xl overflow-hidden relative touch-feedback shadow-sm"
    @click="goToDetail"
    :aria-label="`${product.name} ราคา ${product.price} บาท`"
  >
    <!-- Discount Badge -->
    <span
      v-if="product.originalPrice || product.original_price"
      class="absolute top-2 left-2 bg-[#f27220] text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10"
      aria-label="`ลด ${discountPercent(product)} เปอร์เซ็นต์`"
    >
      -{{ discountPercent(product) }}%
    </span>

    <!-- Wishlist Button -->
    <button
      v-if="enableWishlist"
      @click.stop="handleToggleWishlist"
      class="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
      :class="
        isWishlisted ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-400'
      "
      :aria-label="isWishlisted ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'"
      :aria-pressed="isWishlisted"
    >
      <Heart
        class="w-3.5 h-3.5"
        :class="{ 'fill-current': isWishlisted }"
        aria-hidden="true"
      />
    </button>

    <!-- Product Image -->
    <div class="aspect-square overflow-hidden bg-gray-50">
      <LazyImage
        :src="product.image"
        :alt="product.name"
        class="w-full h-full"
      />
    </div>

    <!-- Product Info -->
    <div class="p-2.5">
      <h3 class="text-xs text-gray-700 line-clamp-2 min-h-[2rem] leading-tight">
        {{ product.name }}
      </h3>

      <div class="mt-1.5 flex items-end justify-between">
        <div>
          <p
            class="text-[#007f3e] font-bold text-sm"
            aria-label="`ราคา ${product.price} บาท`"
          >
            ฿{{ product.price }}
          </p>
          <p
            v-if="product.originalPrice || product.original_price"
            class="text-gray-400 text-[10px] line-through"
            aria-label="`ราคาเดิม ${product.originalPrice || product.original_price} บาท`"
          >
            ฿{{ product.originalPrice || product.original_price }}
          </p>
        </div>

        <!-- Quantity Controls -->
        <div
          v-if="quantityInCart > 0"
          class="flex items-center"
          @click.stop
          role="group"
          aria-label="ปรับจำนวนสินค้า"
        >
          <button
            @click="handleRemove"
            class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
            aria-label="ลดจำนวน"
          >
            <Minus class="w-3 h-3 text-gray-600" aria-hidden="true" />
          </button>
          <span
            class="w-6 text-center font-bold text-xs"
            aria-label="`จำนวน ${quantityInCart} ชิ้น`"
            >{{ quantityInCart }}</span
          >
          <button
            @click="handleAdd"
            class="w-6 h-6 bg-[#007f3e] rounded-full flex items-center justify-center"
            aria-label="เพิ่มจำนวน"
          >
            <Plus class="w-3 h-3 text-white" aria-hidden="true" />
          </button>
        </div>

        <!-- Add Button -->
        <button
          v-else
          @click.stop="handleAdd"
          class="w-8 h-8 bg-[#007f3e] rounded-full flex items-center justify-center"
          aria-label="เพิ่มลงตะกร้า"
        >
          <Plus class="w-4 h-4 text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>
