import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const frequentProducts = ref([])
const loading = ref(false)
const lastFetched = ref(null)

export function useFrequentlyBought() {
  const authStore = useAuthStore()
  const cartStore = useCartStore()

  // Get products sorted by purchase frequency
  const sortedProducts = computed(() => {
    return [...frequentProducts.value].sort((a, b) => b.purchase_count - a.purchase_count)
  })

  // Top 10 frequently bought
  const topProducts = computed(() => sortedProducts.value.slice(0, 10))

  // Fetch frequently bought products from order history
  async function fetchFrequentlyBought(forceRefresh = false) {
    if (!authStore.user) {
      frequentProducts.value = []
      return
    }

    // Cache for 5 minutes
    const cacheTime = 5 * 60 * 1000
    if (!forceRefresh && lastFetched.value && Date.now() - lastFetched.value < cacheTime) {
      return
    }

    loading.value = true
    try {
      // Get all order items from completed orders
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          product_price,
          quantity,
          orders!inner (
            user_id,
            status,
            created_at
          )
        `)
        .eq('orders.user_id', authStore.user.id)
        .in('orders.status', ['delivered', 'completed'])
        .order('orders(created_at)', { ascending: false })

      if (error) throw error

      // Aggregate by product_id
      const productMap = new Map()
      
      for (const item of orderItems || []) {
        const existing = productMap.get(item.product_id)
        if (existing) {
          existing.purchase_count += item.quantity
          existing.total_spent += item.product_price * item.quantity
          existing.last_purchased = Math.max(
            existing.last_purchased,
            new Date(item.orders.created_at).getTime()
          )
        } else {
          productMap.set(item.product_id, {
            product_id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            purchase_count: item.quantity,
            total_spent: item.product_price * item.quantity,
            last_purchased: new Date(item.orders.created_at).getTime()
          })
        }
      }

      // Get current product info (for images and updated prices)
      const productIds = Array.from(productMap.keys())
      if (productIds.length > 0) {
        const { data: currentProducts } = await supabase
          .from('products')
          .select('id, name, price, original_price, image, is_active, stock')
          .in('id', productIds)
          .eq('is_active', true)

        // Merge with current product data
        const mergedProducts = []
        for (const product of currentProducts || []) {
          const history = productMap.get(product.id)
          if (history) {
            mergedProducts.push({
              ...product,
              purchase_count: history.purchase_count,
              total_spent: history.total_spent,
              last_purchased: history.last_purchased,
              // Keep historical price for comparison
              historical_price: history.price
            })
          }
        }

        frequentProducts.value = mergedProducts
      } else {
        frequentProducts.value = []
      }

      lastFetched.value = Date.now()
    } catch (e) {
      console.error('Error fetching frequently bought:', e)
    } finally {
      loading.value = false
    }
  }

  // Add all frequently bought items to cart (reorder)
  function reorderAll() {
    for (const product of topProducts.value) {
      if (product.stock > 0 || product.stock === null) {
        cartStore.addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        })
      }
    }
  }

  // Add single product to cart
  function addToCart(product) {
    cartStore.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    })
  }

  // Check if price changed since last purchase
  function getPriceChange(product) {
    if (!product.historical_price) return null
    const diff = product.price - product.historical_price
    if (diff === 0) return null
    return {
      amount: Math.abs(diff),
      direction: diff > 0 ? 'up' : 'down',
      percent: Math.round((Math.abs(diff) / product.historical_price) * 100)
    }
  }

  // Format last purchased date
  function formatLastPurchased(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'วันนี้'
    if (diffDays === 1) return 'เมื่อวาน'
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`
    return `${Math.floor(diffDays / 365)} ปีที่แล้ว`
  }

  // Clear cache (call on logout)
  function clearCache() {
    frequentProducts.value = []
    lastFetched.value = null
  }

  return {
    frequentProducts,
    sortedProducts,
    topProducts,
    loading,
    fetchFrequentlyBought,
    reorderAll,
    addToCart,
    getPriceChange,
    formatLastPurchased,
    clearCache
  }
}
