import { ref, computed } from "vue";
import { useProductsStore } from "../stores/products";
import { useRecentlyViewed } from "./useRecentlyViewed";
import { useAuthStore } from "../stores/auth";

const recommendations = ref([]);
const loading = ref(false);
const orderHistoryCategories = ref([]);
const lastGenerated = ref(null);
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export function useRecommendations() {
  const productsStore = useProductsStore();
  const { recentlyViewedProducts } = useRecentlyViewed();
  const authStore = useAuthStore();

  // Check if recommendations are cached
  const isCached = () => {
    return lastGenerated.value && 
           Date.now() - lastGenerated.value < CACHE_TIME && 
           recommendations.value.length > 0;
  };

  // Fetch categories from order history (lazy import supabase)
  const fetchOrderHistoryCategories = async () => {
    if (!authStore.user) return [];
    
    try {
      const { supabase } = await import("../lib/supabase");
      
      // Get recent orders with items
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          order_items (
            product_id
          )
        `)
        .eq('user_id', authStore.user.id)
        .in('status', ['delivered', 'confirmed', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get product IDs from orders
      const productIds = orders
        ?.flatMap(o => o.order_items?.map(i => i.product_id) || [])
        .filter(Boolean) || [];

      if (productIds.length === 0) return [];

      // Get categories from store cache first
      const cachedProducts = productsStore.getProductsByIds([...new Set(productIds)]);
      if (cachedProducts.length > 0) {
        return cachedProducts.map(p => p.category_id).filter(Boolean);
      }

      // Fallback to fetch
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('category_id')
        .in('id', [...new Set(productIds)]);

      if (prodError) throw prodError;

      return products?.map(p => p.category_id).filter(Boolean) || [];
    } catch (e) {
      console.error('Failed to fetch order history categories:', e);
      return [];
    }
  };

  // Generate recommendations using store cache
  const generateRecommendations = async (currentProductId = null, forceRefresh = false) => {
    // Return cached if available
    if (!forceRefresh && isCached()) {
      return recommendations.value;
    }

    loading.value = true;
    try {
      // Get categories from order history
      const historyCategories = await fetchOrderHistoryCategories();
      orderHistoryCategories.value = historyCategories;

      // Get categories from recently viewed products
      const viewedCategories = recentlyViewedProducts.value
        .map((p) => p.category_id)
        .filter(Boolean);

      // Combine categories (order history has priority)
      const allCategories = [...new Set([...historyCategories, ...viewedCategories])];

      // Get price range from recently viewed
      const prices = recentlyViewedProducts.value.map((p) => p.price);
      const avgPrice = prices.length
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : 0;
      const minPrice = avgPrice * 0.5;
      const maxPrice = avgPrice * 1.5;

      // Use store cache for filtering
      let candidateProducts = [...productsStore.products];

      // Exclude current product
      if (currentProductId) {
        candidateProducts = candidateProducts.filter(p => p.id !== currentProductId);
      }

      // Exclude already viewed products
      const viewedIds = recentlyViewedProducts.value.map((p) => p.id);
      if (viewedIds.length > 0) {
        candidateProducts = candidateProducts.filter(p => !viewedIds.includes(p.id));
      }

      // Filter by categories if available
      if (allCategories.length > 0) {
        const categoryFiltered = candidateProducts.filter(p => allCategories.includes(p.category_id));
        if (categoryFiltered.length >= 4) {
          candidateProducts = categoryFiltered;
        }
      }

      // Filter by price range if available
      if (avgPrice > 0) {
        const priceFiltered = candidateProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);
        if (priceFiltered.length >= 4) {
          candidateProducts = priceFiltered;
        }
      }

      // Score and sort recommendations
      const scored = candidateProducts.map((product) => {
        let score = 0;

        // Highest boost if in same category as order history
        if (historyCategories.includes(product.category_id)) score += 5;

        // Boost if in same category as recently viewed
        if (viewedCategories.includes(product.category_id)) score += 3;

        // Boost flash sale products
        if (product.is_flash_sale) score += 2;

        // Boost products with discount
        if (product.original_price && product.original_price > product.price) {
          score += 1;
        }

        // Boost products with good stock (popular)
        if (product.stock > 50) score += 1;

        return { ...product, score };
      });

      // Sort by score and take top results
      recommendations.value = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      
      lastGenerated.value = Date.now();
    } catch (e) {
      console.error("Failed to generate recommendations:", e);
      recommendations.value = [];
    } finally {
      loading.value = false;
    }
    
    return recommendations.value;
  };

  // Get recommendations for similar products (same category) - use store cache
  const getSimilarProducts = (productId, categoryId, limit = 6) => {
    return productsStore.products
      .filter(p => p.category_id === categoryId && p.id !== productId && p.is_active !== false)
      .slice(0, limit);
  };

  // Get "Customers also viewed" based on category - use store cache
  const getCustomersAlsoViewed = (categoryId, excludeIds = [], limit = 6) => {
    return productsStore.products
      .filter(p => p.category_id === categoryId && !excludeIds.includes(p.id) && p.is_active !== false)
      .slice(0, limit);
  };

  // Invalidate cache
  const invalidateCache = () => {
    lastGenerated.value = null;
    recommendations.value = [];
  };

  return {
    recommendations: computed(() => recommendations.value),
    loading: computed(() => loading.value),
    generateRecommendations,
    getSimilarProducts,
    getCustomersAlsoViewed,
    invalidateCache,
  };
}
