import { ref, computed } from "vue";
import { supabase } from "../lib/supabase";

const bundles = ref([]);
const loading = ref(false);

export function useBundles() {
  // Fetch active bundles
  const fetchBundles = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("product_bundles")
        .select(`
          *,
          bundle_products (
            quantity,
            is_required,
            products (*)
          )
        `)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      bundles.value = data || [];
    } catch (e) {
      console.error("Failed to fetch bundles:", e);
      bundles.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Get bundles for specific product
  const getBundlesForProduct = async (productId) => {
    try {
      const { data, error } = await supabase
        .from("bundle_products")
        .select(`
          bundle_id,
          product_bundles (
            *,
            bundle_products (
              quantity,
              products (*)
            )
          )
        `)
        .eq("product_id", productId);

      if (error) throw error;
      
      return data
        ?.map((item) => item.product_bundles)
        .filter((bundle) => bundle && bundle.is_active) || [];
    } catch (e) {
      console.error("Failed to get bundles for product:", e);
      return [];
    }
  };

  // Get frequently bought together products
  const getFrequentlyBoughtTogether = async (productId, limit = 4) => {
    try {
      const { data, error } = await supabase
        .from("product_associations")
        .select(`
          product_b_id,
          frequency,
          confidence,
          products!product_associations_product_b_id_fkey (*)
        `)
        .eq("product_a_id", productId)
        .order("frequency", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data?.map((item) => ({
        ...item.products,
        frequency: item.frequency,
        confidence: item.confidence,
      })) || [];
    } catch (e) {
      console.error("Failed to get frequently bought together:", e);
      return [];
    }
  };

  // Calculate bundle savings
  const calculateBundleSavings = (bundle) => {
    if (!bundle || !bundle.bundle_products) return 0;

    const totalPrice = bundle.bundle_products.reduce((sum, item) => {
      return sum + (item.products?.price || 0) * item.quantity;
    }, 0);

    let finalPrice = totalPrice;

    if (bundle.discount_type === "percentage") {
      finalPrice = totalPrice * (1 - bundle.discount_value / 100);
    } else if (bundle.discount_type === "fixed") {
      finalPrice = totalPrice - bundle.discount_value;
    } else if (bundle.discount_type === "special_price") {
      finalPrice = bundle.discount_value;
    }

    return Math.max(0, totalPrice - finalPrice);
  };

  // Calculate bundle final price
  const calculateBundlePrice = (bundle) => {
    if (!bundle || !bundle.bundle_products) return 0;

    const totalPrice = bundle.bundle_products.reduce((sum, item) => {
      return sum + (item.products?.price || 0) * item.quantity;
    }, 0);

    let finalPrice = totalPrice;

    if (bundle.discount_type === "percentage") {
      finalPrice = totalPrice * (1 - bundle.discount_value / 100);
    } else if (bundle.discount_type === "fixed") {
      finalPrice = totalPrice - bundle.discount_value;
    } else if (bundle.discount_type === "special_price") {
      finalPrice = bundle.discount_value;
    }

    return Math.max(0, finalPrice);
  };

  // Check if cart qualifies for bundle
  const checkBundleEligibility = (bundle, cartItems) => {
    if (!bundle || !bundle.bundle_products) return false;

    const requiredProducts = bundle.bundle_products.filter((bp) => bp.is_required);
    
    return requiredProducts.every((bp) => {
      const cartItem = cartItems.find((item) => item.id === bp.products.id);
      return cartItem && cartItem.quantity >= bp.quantity;
    });
  };

  return {
    bundles: computed(() => bundles.value),
    loading: computed(() => loading.value),
    fetchBundles,
    getBundlesForProduct,
    getFrequentlyBoughtTogether,
    calculateBundleSavings,
    calculateBundlePrice,
    checkBundleEligibility,
  };
}
