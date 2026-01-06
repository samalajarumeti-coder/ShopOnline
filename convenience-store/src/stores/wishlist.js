import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'

const WISHLIST_KEY = 'convenience-store-wishlist'
const RECENTLY_VIEWED_KEY = 'convenience-store-recently-viewed'
const MAX_RECENTLY_VIEWED = 10

export const useWishlistStore = defineStore('wishlist', () => {
  // Load from localStorage
  const wishlistIds = ref(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'))
  const recentlyViewedIds = ref(JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'))
  
  // Cached products data
  const wishlistProducts = ref([])
  const recentlyViewedProducts = ref([])
  const loading = ref(false)

  // Persist to localStorage
  watch(wishlistIds, (ids) => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
  }, { deep: true })

  watch(recentlyViewedIds, (ids) => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids))
  }, { deep: true })

  const wishlistCount = computed(() => wishlistIds.value.length)
  const recentlyViewedCount = computed(() => recentlyViewedIds.value.length)

  // Check if product is in wishlist
  function isInWishlist(productId) {
    return wishlistIds.value.includes(Number(productId))
  }

  // Toggle wishlist
  function toggleWishlist(productId) {
    const id = Number(productId)
    const index = wishlistIds.value.indexOf(id)
    
    if (index > -1) {
      wishlistIds.value.splice(index, 1)
      wishlistProducts.value = wishlistProducts.value.filter(p => p.id !== id)
      return false // removed
    } else {
      wishlistIds.value.unshift(id)
      return true // added
    }
  }

  // Add to recently viewed
  function addToRecentlyViewed(productId) {
    const id = Number(productId)
    // Remove if exists
    const index = recentlyViewedIds.value.indexOf(id)
    if (index > -1) {
      recentlyViewedIds.value.splice(index, 1)
    }
    // Add to front
    recentlyViewedIds.value.unshift(id)
    // Limit size
    if (recentlyViewedIds.value.length > MAX_RECENTLY_VIEWED) {
      recentlyViewedIds.value = recentlyViewedIds.value.slice(0, MAX_RECENTLY_VIEWED)
    }
  }

  // Fetch wishlist products from Supabase
  async function fetchWishlistProducts() {
    if (wishlistIds.value.length === 0) {
      wishlistProducts.value = []
      return
    }
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', wishlistIds.value)
        .eq('is_active', true)
      
      if (error) throw error
      
      // Sort by wishlist order
      wishlistProducts.value = wishlistIds.value
        .map(id => data.find(p => p.id === id))
        .filter(Boolean)
    } catch (e) {
      console.error('Error fetching wishlist:', e)
    } finally {
      loading.value = false
    }
  }

  // Fetch recently viewed products
  async function fetchRecentlyViewed() {
    if (recentlyViewedIds.value.length === 0) {
      recentlyViewedProducts.value = []
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', recentlyViewedIds.value)
        .eq('is_active', true)
      
      if (error) throw error
      
      // Sort by recently viewed order
      recentlyViewedProducts.value = recentlyViewedIds.value
        .map(id => data.find(p => p.id === id))
        .filter(Boolean)
    } catch (e) {
      console.error('Error fetching recently viewed:', e)
    }
  }

  // Clear all
  function clearWishlist() {
    wishlistIds.value = []
    wishlistProducts.value = []
  }

  function clearRecentlyViewed() {
    recentlyViewedIds.value = []
    recentlyViewedProducts.value = []
  }

  return {
    wishlistIds,
    recentlyViewedIds,
    wishlistProducts,
    recentlyViewedProducts,
    loading,
    wishlistCount,
    recentlyViewedCount,
    isInWishlist,
    toggleWishlist,
    addToRecentlyViewed,
    fetchWishlistProducts,
    fetchRecentlyViewed,
    clearWishlist,
    clearRecentlyViewed
  }
})
