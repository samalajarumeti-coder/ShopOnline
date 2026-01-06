<script setup>
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { MapPin, Search, ChevronDown, X, Bell, Heart } from "lucide-vue-next";
import { useProductsStore } from "../stores/products";
import { useAddressesStore } from "../stores/addresses";
import { useAuthStore } from "../stores/auth";
import { useWishlistStore } from "../stores/wishlist";

const router = useRouter();
const productsStore = useProductsStore();
const addressesStore = useAddressesStore();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();

const searchQuery = ref("");
const searchResults = ref([]);
const showResults = ref(false);
const searching = ref(false);

// Wishlist count
const wishlistCount = computed(() => wishlistStore.items?.length || 0);

// Debounced search
let searchTimeout = null;
watch(searchQuery, (query) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!query.trim()) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  searching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await productsStore.searchProducts(query);
      showResults.value = true;
    } finally {
      searching.value = false;
    }
  }, 300);
});

const selectProduct = (product) => {
  searchQuery.value = "";
  showResults.value = false;
  router.push(`/customer/product/${product.id}`);
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  showResults.value = false;
};

const defaultAddress = () => {
  if (authStore.isLoggedIn && addressesStore.addresses.length > 0) {
    return addressesStore.getDefaultAddress()?.label || "เลือกที่อยู่";
  }
  return "บ้านของฉัน";
};
</script>

<template>
  <header
    class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-[#007f3e] safe-top"
  >
    <!-- Top Bar: Address + Icons -->
    <div class="px-4 pt-3 pb-2 flex items-center gap-3 text-white">
      <!-- Address -->
      <router-link
        :to="authStore.isLoggedIn ? '/customer/addresses' : '/customer/login'"
        class="flex items-center gap-2 flex-1 min-w-0 touch-feedback"
        aria-label="เลือกที่อยู่จัดส่ง"
      >
        <MapPin class="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden="true" />
        <div class="flex-1 min-w-0">
          <p class="text-[10px] opacity-70 leading-none">จัดส่งที่</p>
          <div class="flex items-center gap-0.5">
            <span class="text-sm font-medium truncate">{{
              defaultAddress()
            }}</span>
            <ChevronDown
              class="w-3.5 h-3.5 flex-shrink-0 opacity-80"
              aria-hidden="true"
            />
          </div>
        </div>
      </router-link>

      <!-- Action Icons -->
      <div class="flex items-center gap-1.5">
        <router-link
          to="/customer/wishlist"
          class="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center touch-feedback"
          aria-label="รายการโปรด"
        >
          <Heart class="w-[18px] h-[18px]" aria-hidden="true" />
          <span
            v-if="wishlistCount > 0"
            class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#f27220] text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1"
            aria-label="`รายการโปรด ${wishlistCount} รายการ`"
          >
            {{ wishlistCount > 9 ? "9+" : wishlistCount }}
          </span>
        </router-link>

        <router-link
          :to="
            authStore.isLoggedIn ? '/customer/notifications' : '/customer/login'
          "
          class="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center touch-feedback"
          aria-label="การแจ้งเตือน"
        >
          <Bell class="w-[18px] h-[18px]" aria-hidden="true" />
          <span
            v-if="authStore.isLoggedIn"
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f27220] rounded-full"
            aria-label="มีการแจ้งเตือนใหม่"
          />
        </router-link>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-4 pb-3 relative">
      <div class="relative" role="search">
        <Search
          class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="ค้นหาสินค้า..."
          class="w-full pl-10 pr-10 py-2.5 rounded-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
          aria-label="ค้นหาสินค้า"
          @focus="showResults = searchResults.length > 0"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 touch-feedback"
          aria-label="ล้างการค้นหา"
        >
          <X class="w-4 h-4 text-gray-400" aria-hidden="true" />
        </button>
      </div>

      <!-- Search Results Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showResults && searchResults.length > 0"
          class="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-xl max-h-72 overflow-y-auto z-50 border border-gray-100"
          role="listbox"
          aria-label="ผลการค้นหา"
        >
          <button
            v-for="product in searchResults.slice(0, 6)"
            :key="product.id"
            @click="selectProduct(product)"
            class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 text-left border-b border-gray-50 last:border-b-0"
            role="option"
            :aria-label="`${product.name} ราคา ${product.price} บาท`"
          >
            <img
              :src="product.image"
              :alt="product.name"
              class="w-12 h-12 rounded-xl object-cover bg-gray-100"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-800 truncate font-medium">
                {{ product.name }}
              </p>
              <p class="text-sm text-[#007f3e] font-bold">
                ฿{{ product.price }}
              </p>
            </div>
          </button>
        </div>
      </Transition>

      <!-- Searching Indicator -->
      <div
        v-if="searching"
        class="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-xl p-4 text-center z-50"
      >
        <div
          class="w-5 h-5 border-2 border-[#007f3e] border-t-transparent rounded-full animate-spin mx-auto"
        />
      </div>

      <!-- No Results -->
      <Transition name="dropdown">
        <div
          v-if="
            showResults &&
            searchQuery &&
            searchResults.length === 0 &&
            !searching
          "
          class="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-xl p-4 text-center text-gray-500 text-sm z-50"
        >
          <p>ไม่พบสินค้า "{{ searchQuery }}"</p>
          <router-link
            to="/customer/categories"
            class="text-[#007f3e] font-medium mt-1 inline-block"
            @click="clearSearch"
          >
            ดูสินค้าทั้งหมด
          </router-link>
        </div>
      </Transition>
    </div>
  </header>

  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="showResults"
      @click="showResults = false"
      class="fixed inset-0 z-40 bg-black/20"
    />
  </Transition>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
