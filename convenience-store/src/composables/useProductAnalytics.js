import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useProductAnalytics() {
  const analytics = ref({
    total_products: 0,
    active_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_views: 0,
    total_purchases: 0,
    avg_price: 0
  })
  const topSelling = ref([])
  const mostViewed = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAnalytics() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_product_analytics')
      if (err) throw err
      if (data && data.length > 0) {
        analytics.value = data[0]
      }
    } catch (e) {
      console.error('Error fetching analytics:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchTopSelling(limit = 10) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_top_selling_products', { limit_count: limit })
      if (err) throw err
      topSelling.value = data || []
    } catch (e) {
      console.error('Error fetching top selling:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchMostViewed(limit = 10) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_most_viewed_products', { limit_count: limit })
      if (err) throw err
      mostViewed.value = data || []
    } catch (e) {
      console.error('Error fetching most viewed:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function incrementView(productId) {
    try {
      await supabase.rpc('increment_product_view', { product_id: productId })
    } catch (e) {
      console.warn('Failed to increment view:', e)
    }
  }

  return {
    analytics,
    topSelling,
    mostViewed,
    loading,
    error,
    fetchAnalytics,
    fetchTopSelling,
    fetchMostViewed,
    incrementView
  }
}
