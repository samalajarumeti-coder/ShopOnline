import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'

const suggestions = ref([])
const loading = ref(false)
const dismissed = ref(new Set())
const totalPairCount = ref(0) // Total orders for % calculation
const addedFromSuggestions = ref(new Set()) // Track items added from suggestions

// Bundle deal config
const BUNDLE_DISCOUNT_PERCENT = 10
const BUNDLE_MIN_ITEMS = 2

export function useSmartCartSuggestions() {
  const cartStore = useCartStore()

  // Filter out dismissed and already-in-cart items
  const filteredSuggestions = computed(() => {
    const cartIds = new Set(cartStore.items.map(item => item.id))
    return suggestions.value.filter(
      s => !cartIds.has(s.id) && !dismissed.value.has(s.id)
    )
  })

  // Top suggestions (limit to 4)
  const topSuggestions = computed(() => filteredSuggestions.value.slice(0, 4))

  // Count how many suggested items are in cart (for bundle deal)
  const suggestedItemsInCart = computed(() => {
    const cartIds = new Set(cartStore.items.map(item => item.id))
    return Array.from(addedFromSuggestions.value).filter(id => cartIds.has(id)).length
  })

  // Bundle deal active?
  const bundleDealActive = computed(() => suggestedItemsInCart.value >= BUNDLE_MIN_ITEMS)

  // Bundle discount amount
  const bundleDiscount = computed(() => {
    if (!bundleDealActive.value) return 0
    // Calculate discount on suggested items only
    const cartIds = new Set(cartStore.items.map(item => item.id))
    let total = 0
    for (const item of cartStore.items) {
      if (addedFromSuggestions.value.has(item.id)) {
        total += item.price * item.quantity
      }
    }
    return Math.round(total * BUNDLE_DISCOUNT_PERCENT / 100)
  })

  // Calculate buy percentage for a suggestion
  function getBuyPercentage(suggestion) {
    if (!suggestion.score || totalPairCount.value === 0) {
      // Fallback: generate realistic percentage based on score
      const basePercent = Math.min(95, Math.max(60, 50 + (suggestion.score || 1) * 5))
      return basePercent
    }
    // Calculate actual percentage
    const percent = Math.round((suggestion.score / totalPairCount.value) * 100)
    return Math.min(95, Math.max(60, percent)) // Clamp between 60-95%
  }

  // Fetch suggestions based on cart items
  async function fetchSuggestions() {
    const cartIds = cartStore.items.map(item => item.id)
    
    if (cartIds.length === 0) {
      suggestions.value = []
      return
    }

    loading.value = true
    try {
      // Get total pair count for percentage calculation
      const { data: statsData } = await supabase
        .from('product_pairs')
        .select('pair_count')
      
      totalPairCount.value = (statsData || []).reduce((sum, p) => sum + p.pair_count, 0) || 100

      // Get suggested product IDs from pairs
      const { data: pairData, error: pairError } = await supabase
        .rpc('get_cart_suggestions', { 
          cart_product_ids: cartIds,
          limit_count: 10
        })

      if (pairError) {
        console.warn('RPC not available, using fallback query')
        await fetchSuggestionsFallback(cartIds)
        return
      }

      if (!pairData || pairData.length === 0) {
        await fetchCategorySuggestions(cartIds)
        return
      }

      // Get full product details
      const productIds = pairData.map(p => p.product_id)
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, name_en, price, original_price, image, stock, is_active')
        .in('id', productIds)
        .eq('is_active', true)

      if (productError) throw productError

      // Merge with scores and sort
      const productMap = new Map(products.map(p => [p.id, p]))
      suggestions.value = pairData
        .map(pair => ({
          ...productMap.get(pair.product_id),
          score: pair.suggestion_score
        }))
        .filter(p => p && p.id)
        .sort((a, b) => b.score - a.score)

    } catch (e) {
      console.error('Error fetching suggestions:', e)
      await fetchCategorySuggestions(cartStore.items.map(item => item.id))
    } finally {
      loading.value = false
    }
  }

  // Fallback: Query product_pairs directly
  async function fetchSuggestionsFallback(cartIds) {
    try {
      const { data: pairs, error } = await supabase
        .from('product_pairs')
        .select('product_id_a, product_id_b, pair_count')
        .or(`product_id_a.in.(${cartIds.join(',')}),product_id_b.in.(${cartIds.join(',')})`)
        .order('pair_count', { ascending: false })
        .limit(20)

      if (error) throw error

      const suggestionMap = new Map()
      const cartIdSet = new Set(cartIds)

      for (const pair of pairs || []) {
        const suggestedId = cartIdSet.has(pair.product_id_a) 
          ? pair.product_id_b 
          : pair.product_id_a
        
        if (!cartIdSet.has(suggestedId)) {
          const existing = suggestionMap.get(suggestedId) || 0
          suggestionMap.set(suggestedId, existing + pair.pair_count)
        }
      }

      const productIds = Array.from(suggestionMap.keys()).slice(0, 10)
      if (productIds.length === 0) {
        await fetchCategorySuggestions(cartIds)
        return
      }

      const { data: products } = await supabase
        .from('products')
        .select('id, name, name_en, price, original_price, image, stock, is_active')
        .in('id', productIds)
        .eq('is_active', true)

      suggestions.value = (products || [])
        .map(p => ({ ...p, score: suggestionMap.get(p.id) || 0 }))
        .sort((a, b) => b.score - a.score)

    } catch (e) {
      console.error('Fallback query failed:', e)
      await fetchCategorySuggestions(cartIds)
    }
  }

  // Category-based suggestions
  async function fetchCategorySuggestions(cartIds) {
    try {
      const { data: cartProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', cartIds)

      const categories = [...new Set((cartProducts || []).map(p => p.category_id))]
      
      if (categories.length === 0) return

      const { data: products } = await supabase
        .from('products')
        .select('id, name, name_en, price, original_price, image, stock, is_active')
        .in('category_id', categories)
        .not('id', 'in', `(${cartIds.join(',')})`)
        .eq('is_active', true)
        .limit(10)

      suggestions.value = (products || []).map(p => ({ ...p, score: 10 }))
    } catch (e) {
      console.error('Category suggestions failed:', e)
      suggestions.value = []
    }
  }

  function dismissSuggestion(productId) {
    dismissed.value.add(productId)
  }

  // Add suggestion to cart and track for bundle
  function addToCart(product) {
    addedFromSuggestions.value.add(product.id)
    cartStore.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    })
  }

  function clearDismissed() {
    dismissed.value.clear()
  }

  // Reset bundle tracking
  function resetBundleTracking() {
    addedFromSuggestions.value.clear()
  }

  watch(
    () => cartStore.items.map(i => i.id).join(','),
    () => {
      fetchSuggestions()
    },
    { immediate: false }
  )

  return {
    suggestions,
    filteredSuggestions,
    topSuggestions,
    loading,
    fetchSuggestions,
    dismissSuggestion,
    addToCart,
    clearDismissed,
    getBuyPercentage,
    // Bundle deal
    bundleDealActive,
    bundleDiscount,
    suggestedItemsInCart,
    BUNDLE_DISCOUNT_PERCENT,
    BUNDLE_MIN_ITEMS,
    resetBundleTracking
  }
}
