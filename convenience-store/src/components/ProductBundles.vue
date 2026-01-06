<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Package, TrendingDown, Plus, ShoppingCart } from "lucide-vue-next";
import { useBundles } from "../composables/useBundles";
import { useCartStore } from "../stores/cart";

const props = defineProps({
  productId: {
    type: [String, Number],
    default: null,
  },
  showFrequentlyBought: {
    type: Boolean,
    default: true,
  },
});

const router = useRouter();
const cartStore = useCartStore();
const {
  getBundlesForProduct,
  getFrequentlyBoughtTogether,
  calculateBundleSavings,
  calculateBundlePrice,
} = useBundles();

const bundles = ref([]);
const frequentlyBought = ref([]);
const loading = ref(false);

onMounted(async () => {
  if (!props.productId) return;

  loading.value = true;
  try {
    const [bundlesData, frequentData] = await Promise.all([
      getBundlesForProduct(props.productId),
      props.showFrequentlyBought
        ? getFrequentlyBoughtTogether(props.productId)
        : Promise.resolve([]),
    ]);

    bundles.value = bundlesData;
    frequentlyBought.value = frequentData;
  } finally {
    loading.value = false;
  }
});

const addBundleToCart = (bundle) => {
  bundle.bundle_products.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      cartStore.addToCart(item.products);
    }
  });
};

const addToCart = (product) => {
  cartStore.addToCart(product);
};

const viewProduct = (productId) => {
  router.push(`/customer/product/${productId}`);
};
</script>

<template>
  <div
    v-if="bundles.length > 0 || frequentlyBought.length > 0"
    class="space-y-4"
  >
    <!-- Product Bundles -->
    <div v-if="bundles.length > 0" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <Package class="w-5 h-5 text-orange-600" />
        <h3 class="font-bold text-gray-800">ดีลพิเศษ - ซื้อคู่คุ้มกว่า</h3>
      </div>

      <div class="space-y-3">
        <div
          v-for="bundle in bundles"
          :key="bundle.id"
          class="border-2 border-orange-200 rounded-xl p-4 bg-orange-50"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-bold text-gray-900">{{ bundle.name }}</h4>
              <p v-if="bundle.description" class="text-sm text-gray-600 mt-1">
                {{ bundle.description }}
              </p>
            </div>
            <div
              class="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
            >
              <TrendingDown class="w-4 h-4" />
              ประหยัด ฿{{ calculateBundleSavings(bundle).toFixed(0) }}
            </div>
          </div>

          <!-- Bundle Products -->
          <div class="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <div
              v-for="(item, index) in bundle.bundle_products"
              :key="index"
              class="flex-shrink-0 relative"
            >
              <div
                @click="viewProduct(item.products.id)"
                class="w-20 h-20 bg-white rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
              >
                <img
                  :src="item.products.image"
                  :alt="item.products.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-if="item.quantity > 1"
                class="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
              >
                {{ item.quantity }}
              </div>
              <Plus
                v-if="index < bundle.bundle_products.length - 1"
                class="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600"
              />
            </div>
          </div>

          <!-- Price and Action -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold text-orange-600">
                ฿{{ calculateBundlePrice(bundle).toFixed(0) }}
              </p>
              <p class="text-sm text-gray-500 line-through">
                ฿{{
                  bundle.bundle_products
                    .reduce(
                      (sum, item) => sum + item.products.price * item.quantity,
                      0
                    )
                    .toFixed(0)
                }}
              </p>
            </div>
            <button
              @click="addBundleToCart(bundle)"
              class="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:scale-95 transition-all font-medium"
            >
              <ShoppingCart class="w-4 h-4" />
              เพิ่มทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Frequently Bought Together -->
    <div
      v-if="frequentlyBought.length > 0"
      class="bg-white rounded-xl p-4 shadow-sm"
    >
      <h3 class="font-bold text-gray-800 mb-4">
        ลูกค้าที่ซื้อสินค้านี้มักซื้อด้วย
      </h3>

      <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <div
          v-for="product in frequentlyBought"
          :key="product.id"
          class="flex-shrink-0 w-32"
        >
          <div
            @click="viewProduct(product.id)"
            class="bg-gray-50 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all"
          >
            <div class="aspect-square bg-white rounded-lg overflow-hidden mb-2">
              <img
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
            </div>
            <p class="text-xs font-medium line-clamp-2 mb-1">
              {{ product.name }}
            </p>
            <p class="text-sm font-bold text-green-700">
              ฿{{ product.price.toFixed(0) }}
            </p>
            <button
              @click.stop="addToCart(product)"
              class="w-full mt-2 py-1 bg-green-700 text-white rounded text-xs hover:bg-green-800 active:scale-95 transition-all"
            >
              เพิ่ม
            </button>
          </div>
        </div>
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
