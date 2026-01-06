/* Path: /product/:id */
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../stores/cart";
import { useWishlistStore } from "../stores/wishlist";
import { useRecentlyViewed } from "../composables/useRecentlyViewed";
import { usePriceAlerts } from "../composables/usePriceAlerts";
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Check,
  Package,
  Truck,
  Shield,
  Zap,
  Bell,
} from "lucide-vue-next";
import ProductCard from "../components/ProductCard.vue";
import ProductQuickView from "../components/ProductQuickView.vue";
import ProductRecommendations from "../components/ProductRecommendations.vue";
import PriceAlertModal from "../components/PriceAlertModal.vue";
import ProductBundles from "../components/ProductBundles.vue";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
const { hasAlert, fetchAlerts } = usePriceAlerts();

const product = ref(null);
const relatedProducts = ref([]);
const loading = ref(true);
const error = ref(null);

// Image gallery state
const currentImageIndex = ref(0);
const showImageModal = ref(false);
const images = computed(() => {
  if (!product.value) return [];
  if (product.value.images?.length) return product.value.images;
  return product.value.image ? [product.value.image] : [];
});

// Wishlist state from store
const isWishlisted = computed(() =>
  product.value ? wishlistStore.isInWishlist(product.value.id) : false
);

// Toast notification
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// Quick View
const showQuickView = ref(false);
const quickViewProduct = ref(null);

// Price Alert
const showPriceAlert = ref(false);

// Touch swipe for gallery
const touchStartX = ref(0);
const touchEndX = ref(0);

const loadProduct = async (id) => {
  loading.value = true;
  error.value = null;
  currentImageIndex.value = 0;

  try {
    const { data, error: err } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("id", id)
      .single();

    if (err) throw err;
    product.value = data;

    // Track recently viewed
    addToRecentlyViewed(id);
    wishlistStore.addToRecentlyViewed(id);

    if (data?.category_id) {
      const { data: related } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", data.category_id)
        .neq("id", id)
        .eq("is_active", true)
        .limit(6);
      relatedProducts.value = related || [];
    }
  } catch (e) {
    error.value = e.message;
    console.error("Error loading product:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadProduct(route.params.id));

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadProduct(newId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
);

const quantityInCart = computed(() => {
  if (!product.value) return 0;
  const item = cartStore.items.find((item) => item.id === product.value.id);
  return item ? item.quantity : 0;
});

const handleAdd = () => {
  if (!product.value) return;
  if (product.value.stock <= 0) {
    showNotification("สินค้าหมด", "error");
    return;
  }
  if (quantityInCart.value >= product.value.stock) {
    showNotification("สินค้าในตะกร้าครบจำนวนสต็อกแล้ว", "warning");
    return;
  }
  cartStore.addToCart(product.value);
  showNotification("เพิ่มลงตะกร้าแล้ว", "success");
};

const handleRemove = () => {
  if (product.value && quantityInCart.value > 0) {
    cartStore.updateQuantity(product.value.id, quantityInCart.value - 1);
  }
};

// Buy Now - Add to cart and go to checkout immediately
const handleBuyNow = () => {
  if (!product.value) return;
  if (product.value.stock <= 0) {
    showNotification("สินค้าหมด", "error");
    return;
  }

  // Add to cart if not already in cart
  if (quantityInCart.value === 0) {
    cartStore.addToCart(product.value);
  }

  // Navigate to checkout
  router.push("/customer/checkout");
};

const discountPercent = computed(() => {
  if (!product.value?.original_price) return 0;
  return Math.round(
    ((product.value.original_price - product.value.price) /
      product.value.original_price) *
      100
  );
});

// Stock status
const stockStatus = computed(() => {
  if (!product.value) return null;
  if (product.value.stock <= 0) return { text: "สินค้าหมด", color: "red" };
  if (product.value.stock <= 5)
    return { text: `เหลือเพียง ${product.value.stock} ชิ้น`, color: "orange" };
  return { text: `มีสินค้า ${product.value.stock} ชิ้น`, color: "green" };
});

// Image gallery functions
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

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX;
  const diff = touchStartX.value - touchEndX.value;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextImage();
    else prevImage();
  }
};

// Wishlist toggle
const toggleWishlist = () => {
  const added = wishlistStore.toggleWishlist(product.value.id);
  showNotification(
    added ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว",
    "success"
  );
};

// Share function
const shareProduct = async () => {
  const url = window.location.href;
  const text = `${product.value.name} - ฿${product.value.price}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: product.value.name, text, url });
    } catch (e) {
      if (e.name !== "AbortError") {
        copyToClipboard(url);
      }
    }
  } else {
    copyToClipboard(url);
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  showNotification("คัดลอกลิงก์แล้ว", "success");
};

// Toast notification
const showNotification = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2500);
};

// Quick View handlers
const handleQuickView = (product) => {
  quickViewProduct.value = product;
  showQuickView.value = true;
};

const handleViewFullDetails = (productId) => {
  router.push(`/customer/product/${productId}`);
};

const handlePriceAlertSuccess = () => {
  showNotification("ตั้งการแจ้งเตือนสำเร็จ", "success");
  fetchAlerts();
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header
      class="bg-white/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm transition-all"
    >
      <div class="flex items-center gap-3 p-4">
        <button
          @click="router.back()"
          class="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-all"
        >
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="text-lg font-bold flex-1 truncate">
          {{ product?.name || "รายละเอียดสินค้า" }}
        </h1>
        <button
          @click="shareProduct"
          class="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-all"
        >
          <Share2 class="w-5 h-5" />
        </button>
        <button
          @click="router.push('/customer/cart')"
          class="p-2 hover:bg-gray-100 active:scale-95 rounded-full relative transition-all"
        >
          <ShoppingCart class="w-6 h-6" />
          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse"
          >
            {{ cartStore.totalItems > 99 ? "99+" : cartStore.totalItems }}
          </span>
        </button>
      </div>
    </header>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="pb-24 animate-pulse">
      <div class="w-full aspect-square bg-gray-200"></div>
      <div class="bg-white p-4 mt-2 space-y-3">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="h-10 bg-gray-200 rounded w-1/3 mt-4"></div>
      </div>
      <div class="bg-white p-4 mt-2 space-y-3">
        <div class="h-5 bg-gray-200 rounded w-1/4"></div>
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-20 px-4"
    >
      <AlertTriangle class="w-16 h-16 text-red-400 mb-4" />
      <p class="text-gray-600 text-center mb-4">ไม่สามารถโหลดข้อมูลสินค้าได้</p>
      <button
        @click="loadProduct(route.params.id)"
        class="px-6 py-2 bg-green-700 text-white rounded-lg"
      >
        ลองใหม่
      </button>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="pb-36">
      <!-- Image Gallery -->
      <div
        class="relative bg-white"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <div class="relative overflow-hidden">
          <div
            class="flex transition-transform duration-300 ease-out"
            :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
          >
            <img
              v-for="(img, index) in images"
              :key="index"
              :src="img"
              :alt="`${product.name} - ${index + 1}`"
              class="w-full aspect-square object-cover flex-shrink-0 cursor-zoom-in"
              @click="showImageModal = true"
            />
          </div>
        </div>

        <!-- Image Navigation -->
        <button
          v-if="images.length > 1"
          @click="prevImage"
          class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>
        <button
          v-if="images.length > 1"
          @click="nextImage"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <ChevronRight class="w-6 h-6" />
        </button>

        <!-- Image Indicators -->
        <div
          v-if="images.length > 1"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
        >
          <button
            v-for="(_, index) in images"
            :key="index"
            @click="currentImageIndex = index"
            class="w-2 h-2 rounded-full transition-all"
            :class="
              currentImageIndex === index ? 'bg-green-700 w-6' : 'bg-white/70'
            "
          ></button>
        </div>

        <!-- Badges -->
        <div class="absolute top-4 left-4 flex flex-col gap-2">
          <span
            v-if="product.original_price"
            class="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
          >
            -{{ discountPercent }}%
          </span>
          <span
            v-if="product.is_flash_sale"
            class="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg animate-pulse"
          >
            🔥 Flash Sale
          </span>
        </div>

        <!-- Wishlist Button -->
        <button
          @click="toggleWishlist"
          class="absolute top-4 right-14 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Heart
            class="w-6 h-6 transition-colors"
            :class="
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            "
          />
        </button>

        <!-- Price Alert Button -->
        <button
          @click="showPriceAlert = true"
          class="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
          :class="hasAlert(product.id) ? 'bg-purple-600' : ''"
        >
          <Bell
            class="w-5 h-5 transition-colors"
            :class="hasAlert(product.id) ? 'text-white' : 'text-gray-600'"
          />
        </button>
      </div>

      <!-- Product Info -->
      <div class="bg-white p-4 mt-2">
        <p class="text-sm text-green-700 font-medium">
          {{ product.categories?.name || "ทั่วไป" }}
        </p>
        <h2 class="text-xl font-bold mt-1">{{ product.name }}</h2>
        <p v-if="product.name_en" class="text-gray-500 text-sm">
          {{ product.name_en }}
        </p>

        <!-- Price -->
        <div class="flex items-end gap-3 mt-4">
          <span class="text-3xl font-bold text-green-700"
            >฿{{ product.price.toLocaleString() }}</span
          >
          <span
            v-if="product.original_price"
            class="text-gray-400 line-through text-lg"
            >฿{{ product.original_price.toLocaleString() }}</span
          >
        </div>

        <!-- Stock Status -->
        <div class="mt-4 flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            :class="{
              'bg-green-100 text-green-700': stockStatus?.color === 'green',
              'bg-orange-100 text-orange-700': stockStatus?.color === 'orange',
              'bg-red-100 text-red-700': stockStatus?.color === 'red',
            }"
          >
            <AlertTriangle
              v-if="stockStatus?.color !== 'green'"
              class="w-4 h-4"
            />
            {{ stockStatus?.text }}
          </span>
        </div>
      </div>

      <!-- Product Description -->
      <div v-if="product.description" class="bg-white p-4 mt-2">
        <h3 class="text-lg font-bold mb-3">รายละเอียดสินค้า</h3>
        <p class="text-gray-600 leading-relaxed whitespace-pre-line">
          {{ product.description }}
        </p>
      </div>

      <!-- Features -->
      <div class="bg-white p-4 mt-2">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
            >
              <Package class="w-6 h-6 text-green-700" />
            </div>
            <span class="text-xs text-gray-600">สินค้าคุณภาพ</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <Truck class="w-6 h-6 text-blue-700" />
            </div>
            <span class="text-xs text-gray-600">จัดส่งรวดเร็ว</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"
            >
              <Shield class="w-6 h-6 text-purple-700" />
            </div>
            <span class="text-xs text-gray-600">รับประกันคุณภาพ</span>
          </div>
        </div>
      </div>

      <!-- Product Bundles / Deals -->
      <div class="px-4 mt-2">
        <ProductBundles :product-id="product.id" />
      </div>

      <!-- Related Products -->
      <div v-if="relatedProducts.length > 0" class="bg-white p-4 mt-2">
        <h3 class="text-lg font-bold mb-4">สินค้าที่คล้ายกัน</h3>
        <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div
            v-for="p in relatedProducts"
            :key="p.id"
            class="flex-shrink-0 w-36"
          >
            <ProductCard
              :product="p"
              :enable-quick-view="true"
              @quick-view="handleQuickView"
            />
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="px-4 pb-2 mt-2">
        <ProductRecommendations
          :current-product-id="product.id"
          title="ลูกค้าที่ดูสินค้านี้ยังสนใจ"
          @quick-view="handleQuickView"
        />
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div
      v-if="product && !loading"
      class="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 z-10"
    >
      <!-- Quantity Controls (when item in cart) -->
      <div v-if="quantityInCart > 0" class="flex items-center gap-2 mb-3">
        <span class="text-sm text-gray-600 mr-2">จำนวนในตะกร้า:</span>
        <div class="flex items-center gap-2 bg-gray-100 rounded-full p-1">
          <button
            @click="handleRemove"
            class="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            <Minus class="w-4 h-4" />
          </button>
          <span class="text-lg font-bold w-8 text-center">{{
            quantityInCart
          }}</span>
          <button
            @click="handleAdd"
            :disabled="quantityInCart >= product.stock"
            class="w-9 h-9 bg-green-700 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button
          @click="handleAdd"
          :disabled="product.stock <= 0"
          class="flex-1 bg-green-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          <ShoppingCart class="w-5 h-5" />
          <span v-if="product.stock <= 0">สินค้าหมด</span>
          <span v-else>{{
            quantityInCart > 0 ? "เพิ่มอีก" : "เพิ่มลงตะกร้า"
          }}</span>
        </button>

        <button
          @click="handleBuyNow"
          :disabled="product.stock <= 0"
          class="flex-1 bg-orange-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          <Zap class="w-5 h-5" />
          <span>ซื้อเลย</span>
        </button>
      </div>
    </div>

    <!-- Image Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showImageModal"
          class="fixed inset-0 bg-black z-50 flex items-center justify-center"
          @click="showImageModal = false"
        >
          <button
            @click="showImageModal = false"
            class="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center z-10"
          >
            <X class="w-6 h-6 text-white" />
          </button>
          <img
            :src="images[currentImageIndex]"
            :alt="product?.name"
            class="max-w-full max-h-full object-contain"
            @click.stop
          />
          <button
            v-if="images.length > 1"
            @click.stop="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronLeft class="w-8 h-8 text-white" />
          </button>
          <button
            v-if="images.length > 1"
            @click.stop="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronRight class="w-8 h-8 text-white" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showToast"
          class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 min-w-[200px]"
          :class="{
            'bg-green-600 text-white': toastType === 'success',
            'bg-orange-500 text-white': toastType === 'warning',
            'bg-red-500 text-white': toastType === 'error',
          }"
        >
          <Check v-if="toastType === 'success'" class="w-5 h-5" />
          <AlertTriangle v-else class="w-5 h-5" />
          <span class="font-medium">{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>

    <!-- Quick View Modal -->
    <ProductQuickView
      v-if="quickViewProduct"
      :product="quickViewProduct"
      :show="showQuickView"
      @close="showQuickView = false"
      @view-full="handleViewFullDetails"
    />

    <!-- Price Alert Modal -->
    <PriceAlertModal
      v-if="product"
      :product="product"
      :show="showPriceAlert"
      @close="showPriceAlert = false"
      @success="handlePriceAlertSuccess"
    />
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  transform: translate(-50%, -10px);
}
</style>
