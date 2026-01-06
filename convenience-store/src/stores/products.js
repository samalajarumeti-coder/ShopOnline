import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'

// Cache configuration
const CACHE_STALE_TIME = 5 * 60 * 1000 // 5 minutes
const FLASH_SALE_CACHE_TIME = 30 * 1000 // 30 seconds for flash sale settings

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const categories = ref([])
  const banners = ref([])
  const loading = ref(false)
  const error = ref(null)
  const isRealtimeConnected = ref(false)

  // Flash Sale settings from app_settings
  const flashSaleSettings = ref({ is_active: true, end_time: null })
  const lastFetchedFlashSaleSettings = ref(null)

  // Cache timestamps
  const lastFetchedProducts = ref(null)
  const lastFetchedCategories = ref(null)
  const lastFetchedBanners = ref(null)

  // Realtime subscriptions
  let productsSubscription = null
  let categoriesSubscription = null
  let bannersSubscription = null
  let appSettingsSubscription = null

  // Flash sale is active only if settings say so AND not expired
  const isFlashSaleActive = computed(() => {
    if (!flashSaleSettings.value.is_active) return false
    if (flashSaleSettings.value.end_time) {
      const endTime = new Date(flashSaleSettings.value.end_time)
      if (endTime < new Date()) return false
    }
    return true
  })

  const flashSaleProducts = computed(() => {
    // Return empty if flash sale is disabled
    if (!isFlashSaleActive.value) return []
    
    return products.value
      .filter(p => p.is_flash_sale)
      .sort((a, b) => (a.flash_sale_order || 999) - (b.flash_sale_order || 999))
  })

  // Flash sale end time for timer display
  const flashSaleEndTime = computed(() => flashSaleSettings.value.end_time)

  const promoProducts = computed(() => 
    products.value.filter(p => p.original_price !== null)
  )

  // Check if cache is stale
  const isCacheStale = (lastFetched) => {
    if (!lastFetched) return true
    return Date.now() - lastFetched > CACHE_STALE_TIME
  }

  // Realtime handlers
  function handleProductChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    // Update cache timestamp on realtime update
    lastFetchedProducts.value = Date.now()
    
    if (eventType === 'INSERT' && newRecord.is_active) {
      products.value.unshift(newRecord)
    } else if (eventType === 'UPDATE') {
      const idx = products.value.findIndex(p => p.id === newRecord.id)
      if (newRecord.is_active) {
        if (idx !== -1) {
          products.value[idx] = newRecord
        } else {
          products.value.unshift(newRecord)
        }
      } else if (idx !== -1) {
        products.value.splice(idx, 1)
      }
    } else if (eventType === 'DELETE') {
      products.value = products.value.filter(p => p.id !== oldRecord.id)
    }
  }

  function handleCategoryChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    lastFetchedCategories.value = Date.now()
    
    if (eventType === 'INSERT') {
      categories.value.push(newRecord)
      categories.value.sort((a, b) => a.sort_order - b.sort_order)
    } else if (eventType === 'UPDATE') {
      const idx = categories.value.findIndex(c => c.id === newRecord.id)
      if (idx !== -1) categories.value[idx] = newRecord
      categories.value.sort((a, b) => a.sort_order - b.sort_order)
    } else if (eventType === 'DELETE') {
      categories.value = categories.value.filter(c => c.id !== oldRecord.id)
    }
  }

  function handleBannerChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    lastFetchedBanners.value = Date.now()
    
    if (eventType === 'INSERT' && newRecord.is_active) {
      banners.value.push(newRecord)
      banners.value.sort((a, b) => a.sort_order - b.sort_order)
    } else if (eventType === 'UPDATE') {
      const idx = banners.value.findIndex(b => b.id === newRecord.id)
      if (newRecord.is_active) {
        if (idx !== -1) {
          banners.value[idx] = newRecord
        } else {
          banners.value.push(newRecord)
        }
        banners.value.sort((a, b) => a.sort_order - b.sort_order)
      } else if (idx !== -1) {
        banners.value.splice(idx, 1)
      }
    } else if (eventType === 'DELETE') {
      banners.value = banners.value.filter(b => b.id !== oldRecord.id)
    }
  }

  // Subscribe to realtime
  function initRealtimeSubscriptions() {
    if (isRealtimeConnected.value) return
    
    productsSubscription = supabase
      .channel('customer-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange)
      .subscribe()

    categoriesSubscription = supabase
      .channel('customer-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, handleCategoryChange)
      .subscribe()

    bannersSubscription = supabase
      .channel('customer-banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, handleBannerChange)
      .subscribe()

    // Subscribe to app_settings changes for flash sale toggle
    appSettingsSubscription = supabase
      .channel('customer-app-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.flash_sale' }, (payload) => {
        if (payload.new?.value) {
          flashSaleSettings.value = payload.new.value
          lastFetchedFlashSaleSettings.value = Date.now()
        }
      })
      .subscribe()

    isRealtimeConnected.value = true
  }

  function unsubscribeAll() {
    if (productsSubscription) supabase.removeChannel(productsSubscription)
    if (categoriesSubscription) supabase.removeChannel(categoriesSubscription)
    if (bannersSubscription) supabase.removeChannel(bannersSubscription)
    if (appSettingsSubscription) supabase.removeChannel(appSettingsSubscription)
    isRealtimeConnected.value = false
  }

  // Fetch flash sale settings
  async function fetchFlashSaleSettings(forceRefresh = false) {
    if (!forceRefresh && lastFetchedFlashSaleSettings.value && 
        Date.now() - lastFetchedFlashSaleSettings.value < FLASH_SALE_CACHE_TIME) {
      return flashSaleSettings.value
    }

    try {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'flash_sale')
        .single()
      
      if (err) throw err
      
      if (data?.value) {
        flashSaleSettings.value = data.value
        lastFetchedFlashSaleSettings.value = Date.now()
      }
    } catch (e) {
      handleSupabaseError(e, 'fetchFlashSaleSettings', false)
    }
    return flashSaleSettings.value
  }

  // Fetch with cache check
  async function fetchProducts(forceRefresh = false) {
    // Return cached data if not stale
    if (!forceRefresh && !isCacheStale(lastFetchedProducts.value) && products.value.length > 0) {
      return products.value
    }

    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (err) throw err
      products.value = data || []
      lastFetchedProducts.value = Date.now()
    } catch (e) {
      error.value = e.message
      handleSupabaseError(e, 'fetchProducts', false)
    } finally {
      loading.value = false
    }
    return products.value
  }

  async function fetchCategories(forceRefresh = false) {
    if (!forceRefresh && !isCacheStale(lastFetchedCategories.value) && categories.value.length > 0) {
      return categories.value
    }

    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (err) throw err
      categories.value = data || []
      lastFetchedCategories.value = Date.now()
    } catch (e) {
      handleSupabaseError(e, 'fetchCategories', false)
    }
    return categories.value
  }

  async function fetchBanners(forceRefresh = false) {
    if (!forceRefresh && !isCacheStale(lastFetchedBanners.value) && banners.value.length > 0) {
      return banners.value
    }

    try {
      const { data, error: err } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (err) throw err
      banners.value = data || []
      lastFetchedBanners.value = Date.now()
    } catch (e) {
      handleSupabaseError(e, 'fetchBanners', false)
    }
    return banners.value
  }

  // Combined fetch for initial load - single batch
  async function fetchAllHomeData(forceRefresh = false) {
    const needsProducts = forceRefresh || isCacheStale(lastFetchedProducts.value) || products.value.length === 0
    const needsCategories = forceRefresh || isCacheStale(lastFetchedCategories.value) || categories.value.length === 0
    const needsBanners = forceRefresh || isCacheStale(lastFetchedBanners.value) || banners.value.length === 0
    const needsFlashSaleSettings = forceRefresh || !lastFetchedFlashSaleSettings.value || 
                                    Date.now() - lastFetchedFlashSaleSettings.value > FLASH_SALE_CACHE_TIME

    // If all cached, return immediately
    if (!needsProducts && !needsCategories && !needsBanners && !needsFlashSaleSettings) {
      return { products: products.value, categories: categories.value, banners: banners.value }
    }

    loading.value = true
    error.value = null

    try {
      const promises = []
      
      if (needsProducts) {
        promises.push(
          supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
        )
      }
      if (needsCategories) {
        promises.push(
          supabase.from('categories').select('*').order('sort_order')
        )
      }
      if (needsBanners) {
        promises.push(
          supabase.from('banners').select('*').eq('is_active', true).order('sort_order')
        )
      }
      if (needsFlashSaleSettings) {
        promises.push(
          supabase.from('app_settings').select('value').eq('key', 'flash_sale').single()
        )
      }

      const results = await Promise.all(promises)
      const now = Date.now()
      let resultIndex = 0

      if (needsProducts) {
        const { data, error: err } = results[resultIndex++]
        if (!err) {
          products.value = data || []
          lastFetchedProducts.value = now
        }
      }
      if (needsCategories) {
        const { data, error: err } = results[resultIndex++]
        if (!err) {
          categories.value = data || []
          lastFetchedCategories.value = now
        }
      }
      if (needsBanners) {
        const { data, error: err } = results[resultIndex++]
        if (!err) {
          banners.value = data || []
          lastFetchedBanners.value = now
        }
      }
      if (needsFlashSaleSettings) {
        const { data, error: err } = results[resultIndex++]
        if (!err && data?.value) {
          flashSaleSettings.value = data.value
          lastFetchedFlashSaleSettings.value = now
        }
      }
    } catch (e) {
      error.value = e.message
      console.error('Error fetching home data:', e)
    } finally {
      loading.value = false
    }

    return { products: products.value, categories: categories.value, banners: banners.value }
  }

  // Force refresh all data
  function invalidateCache() {
    lastFetchedProducts.value = null
    lastFetchedCategories.value = null
    lastFetchedBanners.value = null
    lastFetchedFlashSaleSettings.value = null
  }

  function getProductsByCategory(categoryId) {
    if (categoryId === 'all') return products.value
    return products.value.filter(p => p.category_id === categoryId)
  }

  // Get product by ID from cache first
  function getProductById(productId) {
    return products.value.find(p => p.id === productId)
  }

  // Get multiple products by IDs from cache
  function getProductsByIds(productIds) {
    return products.value.filter(p => productIds.includes(p.id))
  }

  async function searchProducts(query) {
    if (!query.trim()) return products.value
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
    
    return data || []
  }

  return {
    products,
    categories,
    banners,
    loading,
    error,
    isRealtimeConnected,
    flashSaleProducts,
    flashSaleEndTime,
    isFlashSaleActive,
    promoProducts,
    fetchProducts,
    fetchCategories,
    fetchBanners,
    fetchFlashSaleSettings,
    fetchAllHomeData,
    invalidateCache,
    getProductsByCategory,
    getProductById,
    getProductsByIds,
    searchProducts,
    initRealtimeSubscriptions,
    unsubscribeAll
  }
})
