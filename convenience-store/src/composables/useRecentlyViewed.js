import { ref, computed } from "vue";
import { useProductsStore } from "../stores/products";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;

const recentlyViewedIds = ref([]);
const recentlyViewedProducts = ref([]);
const loading = ref(false);
const initialized = ref(false);

export function useRecentlyViewed() {
  const productsStore = useProductsStore();

  // Load from localStorage on init
  const loadFromStorage = () => {
    if (initialized.value) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        recentlyViewedIds.value = JSON.parse(stored);
      }
      initialized.value = true;
    } catch (e) {
      console.error("Failed to load recently viewed:", e);
    }
  };

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedIds.value));
    } catch (e) {
      console.error("Failed to save recently viewed:", e);
    }
  };

  // Add product to recently viewed
  const addProduct = (productId) => {
    if (!productId) return;

    // Remove if already exists
    const filtered = recentlyViewedIds.value.filter((id) => id !== productId);

    // Add to beginning
    recentlyViewedIds.value = [productId, ...filtered].slice(0, MAX_ITEMS);

    saveToStorage();
    syncWithStore();
  };

  // Sync with products store (use cached data)
  const syncWithStore = () => {
    if (recentlyViewedIds.value.length === 0) {
      recentlyViewedProducts.value = [];
      return;
    }

    // Try to get from store cache first
    const cachedProducts = productsStore.getProductsByIds(recentlyViewedIds.value);
    
    if (cachedProducts.length > 0) {
      // Sort by recently viewed order
      const sorted = recentlyViewedIds.value
        .map((id) => cachedProducts.find((p) => p.id === id))
        .filter(Boolean);
      recentlyViewedProducts.value = sorted;
    }
  };

  // Fetch products only if not in store cache
  const fetchProducts = async () => {
    if (recentlyViewedIds.value.length === 0) {
      recentlyViewedProducts.value = [];
      return;
    }

    // First try store cache
    syncWithStore();
    
    // If we got all products from cache, no need to fetch
    if (recentlyViewedProducts.value.length === recentlyViewedIds.value.length) {
      return;
    }

    // Only fetch missing products
    loading.value = true;
    try {
      const { supabase } = await import("../lib/supabase");
      const missingIds = recentlyViewedIds.value.filter(
        id => !recentlyViewedProducts.value.find(p => p.id === id)
      );

      if (missingIds.length === 0) {
        loading.value = false;
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", missingIds)
        .eq("is_active", true);

      if (error) throw error;

      // Merge with existing and sort
      const allProducts = [...recentlyViewedProducts.value, ...(data || [])];
      const sorted = recentlyViewedIds.value
        .map((id) => allProducts.find((p) => p.id === id))
        .filter(Boolean);

      recentlyViewedProducts.value = sorted;
    } catch (e) {
      console.error("Failed to fetch recently viewed products:", e);
    } finally {
      loading.value = false;
    }
  };

  // Clear all
  const clear = () => {
    recentlyViewedIds.value = [];
    recentlyViewedProducts.value = [];
    localStorage.removeItem(STORAGE_KEY);
  };

  // Remove specific product
  const removeProduct = (productId) => {
    recentlyViewedIds.value = recentlyViewedIds.value.filter(
      (id) => id !== productId
    );
    recentlyViewedProducts.value = recentlyViewedProducts.value.filter(
      (p) => p.id !== productId
    );
    saveToStorage();
  };

  // Initialize only once
  loadFromStorage();
  if (recentlyViewedIds.value.length > 0 && recentlyViewedProducts.value.length === 0) {
    syncWithStore();
  }

  return {
    recentlyViewedProducts: computed(() => recentlyViewedProducts.value),
    loading: computed(() => loading.value),
    addProduct,
    removeProduct,
    clear,
    fetchProducts,
    syncWithStore,
  };
}
