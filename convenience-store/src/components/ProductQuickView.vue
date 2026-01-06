<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cart";
import { useWishlistStore } from "../stores/wishlist";
import {
  X,
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertTriangle,
  Eye,
} from "lucide-vue-next";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "view-full"]);

const router = useRouter();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

const currentImageIndex = ref(0);
const showToast = ref(false);
const toastMessage = ref("");

const images = computed(() => {
  if (props.product.images?.length) return props.product.images;
  return props.product.image ? [props.product.image] : [];
});

const quantityInCart = computed(() => {
  const item = cartStore.items.find((item) => item.id === props.product.id);
  return item ? item.quantity : 0;
});

const isWishlisted = computed(() =>
  wishlistStore.isInWishlist(props.product.id)
);

const discountPercent = computed(() => {
  if (!props.product.original_price) return 0;
  return Math.round(
    ((props.product.original_price - props.product.price) /
      props.product.original_price) *
      100
  );
});

const stockStatus = computed(() => {
  if (props.product.stock <= 0) return { text: "สินค้าหมด", color: "red" };
  if (props.product.stock <= 5)
    return {
      text: `เหลือเพียง ${props.product.stock} ชิ้น`,
      color: "orange",
    };
  return { text: `มีสินค้า ${props.product.stock} ชิ้น`, color: "green" };
});

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
};

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = images.value.length - 1;
  }
};

const handleAdd = () => {
  if (props.product.stock <= 0) {
    showNotification("สินค้าหมด");
    return;
  }
  if (quantityInCart.value >= props.product.stock) {
    showNotification("สินค้าในตะกร้าครบจำนวนสต็อกแล้ว");
    return;
  }
  cartStore.addToCart(props.product);
  showNotification("เพิ่มลงตะกร้าแล้ว");
};

const handleRemove = () => {
  if (quantityInCart.value > 0) {
    cartStore.updateQuantity(props.product.id, quantityInCart.value - 1);
  }
};

const toggleWishlist = () => {
  wishlistStore.toggleWishlist(props.product.id);
  showNotification(
    isWishlisted.value ? "เพิ่มในรายการโปรด" : "นำออกจากรายการโปรด"
  );
};

const handleBuyNow = () => {
  if (props.product.stock <= 0) return;
  if (quantityInCart.value === 0) {
    cartStore.addToCart(props.product);
  }
  emit("close");
  router.push("/customer/checkout");
};

const viewFullDetails = () => {
  emit("view-full", props.product.id);
  emit("close");
};

const showNotification = (message) => {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2000);
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click="emit('close')"
      >
        <div
          @click.stop
          class="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <!-- Header -->
          <div
            class="sticky top-0 bg-white/95 backdrop-blur-sm border-b z-10 p-4 flex items-center justify-between"
          >
            <h3 class="font-bold text-lg">รายละเอียดสินค้า</h3>
            <button
              @click="emit('close')"
              class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Image Gallery -->
          <div class="relative bg-gray-50">
            <div class="relative overflow-hidden">
              <div
                class="flex transition-transform duration-300 ease-out"
                :style="{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                }"
              >
                <img
                  v-for="(img, index) in images"
                  :key="index"
                  :src="img"
                  :alt="`${product.name} - ${index + 1}`"
                  class="w-full aspect-square object-cover flex-shrink-0"
                />
              </div>
            </div>

            <!-- Image Navigation -->
            <button
              v-if="images.length > 1"
              @click="prevImage"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <button
              v-if="images.length > 1"
              @click="nextImage"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
            >
              <ChevronRight class="w-5 h-5" />
            </button>

            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-2">
              <span
                v-if="product.original_price"
                class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
              >
                -{{ discountPercent }}%
              </span>
              <span
                v-if="product.is_flash_sale"
                class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
              >
                🔥 Flash Sale
              </span>
            </div>

            <!-- Wishlist -->
            <button
              @click="toggleWishlist"
              class="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
            >
              <Heart
                class="w-5 h-5 transition-colors"
                :class="
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                "
              />
            </button>

            <!-- Image Indicators -->
            <div
              v-if="images.length > 1"
              class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
            >
              <button
                v-for="(_, index) in images"
                :key="index"
                @click="currentImageIndex = index"
                class="w-1.5 h-1.5 rounded-full transition-all"
                :class="
                  currentImageIndex === index
                    ? 'bg-green-700 w-4'
                    : 'bg-white/70'
                "
              ></button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-4 space-y-4">
            <div>
              <p class="text-sm text-green-700 font-medium">
                {{ product.categories?.name || "ทั่วไป" }}
              </p>
              <h2 class="text-xl font-bold mt-1">{{ product.name }}</h2>
              <p v-if="product.name_en" class="text-gray-500 text-sm">
                {{ product.name_en }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-end gap-3">
              <span class="text-2xl font-bold text-green-700"
                >฿{{ product.price.toLocaleString() }}</span
              >
              <span
                v-if="product.original_price"
                class="text-gray-400 line-through text-base"
                >฿{{ product.original_price.toLocaleString() }}</span
              >
            </div>

            <!-- Stock Status -->
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                :class="{
                  'bg-green-100 text-green-700': stockStatus.color === 'green',
                  'bg-orange-100 text-orange-700':
                    stockStatus.color === 'orange',
                  'bg-red-100 text-red-700': stockStatus.color === 'red',
                }"
              >
                <AlertTriangle
                  v-if="stockStatus.color !== 'green'"
                  class="w-4 h-4"
                />
                {{ stockStatus.text }}
              </span>
            </div>

            <!-- Description -->
            <div v-if="product.description" class="pt-3 border-t">
              <p class="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                {{ product.description }}
              </p>
              <button
                @click="viewFullDetails"
                class="text-green-700 text-sm font-medium mt-2 flex items-center gap-1 hover:gap-2 transition-all"
              >
                <Eye class="w-4 h-4" />
                ดูรายละเอียดเพิ่มเติม
              </button>
            </div>

            <!-- Quantity Controls -->
            <div
              v-if="quantityInCart > 0"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <span class="text-sm text-gray-600">จำนวนในตะกร้า:</span>
              <div class="flex items-center gap-2 bg-white rounded-full p-1">
                <button
                  @click="handleRemove"
                  class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-all"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="text-base font-bold w-8 text-center">{{
                  quantityInCart
                }}</span>
                <button
                  @click="handleAdd"
                  :disabled="quantityInCart >= product.stock"
                  class="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-2">
              <button
                @click="handleAdd"
                :disabled="product.stock <= 0"
                class="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-gray-400"
              >
                <ShoppingCart class="w-5 h-5" />
                <span>{{
                  quantityInCart > 0 ? "เพิ่มอีก" : "เพิ่มลงตะกร้า"
                }}</span>
              </button>
              <button
                @click="handleBuyNow"
                :disabled="product.stock <= 0"
                class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-gray-400"
              >
                <Zap class="w-5 h-5" />
                <span>ซื้อเลย</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Toast -->
        <Transition name="toast">
          <div
            v-if="showToast"
            class="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
          >
            {{ toastMessage }}
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white {
  transform: translateY(100%);
}

.modal-leave-to .bg-white {
  transform: translateY(100%);
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.toast-leave-to {
  opacity: 0;
}
</style>
