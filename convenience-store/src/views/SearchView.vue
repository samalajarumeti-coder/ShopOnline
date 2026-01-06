<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useProductsStore } from "../stores/products";
import { useSearchHistory } from "../composables/useSearchHistory";
import { Search, X, Clock, TrendingUp, Loader2 } from "lucide-vue-next";
import ProductCard from "../components/ProductCard.vue";

const router = useRouter();
const productsStore = useProductsStore();
const { searchHistory, addToHistory, removeFromHistory, clearHistory } =
  useSearchHistory();

const searchQuery = ref("");
const searching = ref(false);
const searchResults = ref([]);

// Popular searches (mock data)
const popularSearches = ref([
  "น้ำดื่ม",
  "กาแฟ",
  "ขนม",
  "นม",
  "ข้าว",
  "มาม่า",
  "เครื่องดื่ม",
  "ของใช้",
]);

const hasResults = computed(() => searchResults.value.length > 0);
const showHistory = computed(
  () => !searchQuery.value && searchHistory.value.length > 0
);
const showPopular = computed(() => !searchQuery.value);

// Debounced search
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!newQuery || newQuery.trim().length === 0) {
    searchResults.value = [];
    searching.value = false;
    return;
  }

  searching.value = true;
  searchTimeout = setTimeout(async () => {
    await performSearch(newQuery);
    searching.value = false;
  }, 300);
});

const performSearch = async (query) => {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    searchResults.value = [];
    return;
  }

  // Search in products
  searchResults.value = productsStore.products.filter((product) => {
    return (
      product.name.toLowerCase().includes(trimmedQuery) ||
      product.name_en?.toLowerCase().includes(trimmedQuery) ||
      product.description?.toLowerCase().includes(trimmedQuery)
    );
  });
};

const handleSearch = (term) => {
  searchQuery.value = term;
  addToHistory(term);
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

const handleProductClick = (productId) => {
  if (searchQuery.value) {
    addToHistory(searchQuery.value);
  }
  router.push(`/customer/product/${productId}`);
};
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Search Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center gap-3 px-4 py-3">
        <button
          @click="router.back()"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X class="w-6 h-6 text-gray-700" />
        </button>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาสินค้า..."
            class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
            autofocus
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X class="w-4 h-4 text-gray-500" />
          </button>
          <Loader2
            v-if="searching"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#007f3e] animate-spin"
          />
        </div>
      </div>
    </div>

    <div class="p-4">
      <!-- Search History -->
      <div v-if="showHistory" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3
            class="text-sm font-semibold text-gray-500 flex items-center gap-2"
          >
            <Clock class="w-4 h-4" />
            ค้นหาล่าสุด
          </h3>
          <button
            @click="clearHistory"
            class="text-sm text-[#007f3e] hover:underline"
          >
            ลบทั้งหมด
          </button>
        </div>
        <div class="space-y-2">
          <button
            v-for="term in searchHistory"
            :key="term"
            @click="handleSearch(term)"
            class="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span class="text-gray-900">{{ term }}</span>
            <button
              @click.stop="removeFromHistory(term)"
              class="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X class="w-4 h-4 text-gray-500" />
            </button>
          </button>
        </div>
      </div>

      <!-- Popular Searches -->
      <div v-if="showPopular" class="mb-6">
        <h3
          class="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"
        >
          <TrendingUp class="w-4 h-4" />
          ค้นหายอดนิยม
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="term in popularSearches"
            :key="term"
            @click="handleSearch(term)"
            class="px-4 py-2 bg-white text-gray-700 rounded-full hover:bg-[#007f3e] hover:text-white transition-colors text-sm"
          >
            {{ term }}
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchQuery">
        <div v-if="searching" class="flex justify-center py-20">
          <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
        </div>

        <div v-else-if="hasResults">
          <h3 class="text-sm font-semibold text-gray-500 mb-3">
            พบ {{ searchResults.length }} รายการ
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <ProductCard
              v-for="product in searchResults"
              :key="product.id"
              :product="product"
              @click="handleProductClick(product.id)"
            />
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-20">
          <div
            class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
          >
            <Search class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">ไม่พบสินค้า</h3>
          <p class="text-gray-500 text-center">
            ลองค้นหาด้วยคำอื่นหรือดูสินค้ายอดนิยม
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
