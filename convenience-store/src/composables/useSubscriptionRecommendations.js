import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

const recommendations = ref([])
const loading = ref(false)

export function useSubscriptionRecommendations() {
  
  // Get product recommendations based on selected items
  async function getRecommendations(selectedProductIds, limit = 6) {
    if (!selectedProductIds?.length) {
      recommendations.value = []
      return []
    }

    loading.value = true
    try {
      // Get categories of selected products
      const { data: selectedProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', selectedProductIds)

      const categoryIds = [...new Set(selectedProducts?.map(p => p.category_id) || [])]

      // Strategy 1: Products from same categories (not already selected)
      const { data: sameCategoryProducts } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoryIds)
        .not('id', 'in', `(${selectedProductIds.join(',')})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2)

      // Strategy 2: Popular products (frequently bought together)
      const { data: popularProducts } = await supabase
        .from('products')
        .select('*')
        .not('id', 'in', `(${selectedProductIds.join(',')})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Strategy 3: Products on sale
      const { data: saleProducts } = await supabase
        .from('products')
        .select('*')
        .not('id', 'in', `(${selectedProductIds.join(',')})`)
        .not('original_price', 'is', null)
        .eq('is_active', true)
        .limit(limit)

      // Combine and deduplicate
      const allProducts = [
        ...(sameCategoryProducts || []),
        ...(saleProducts || []),
        ...(popularProducts || [])
      ]

      // Remove duplicates and score products
      const productMap = new Map()
      for (const product of allProducts) {
        if (!productMap.has(product.id)) {
          // Calculate recommendation score
          let score = 0
          
          // Same category bonus
          if (categoryIds.includes(product.category_id)) {
            score += 10
          }
          
          // On sale bonus
          if (product.original_price) {
            const discount = ((product.original_price - product.price) / product.original_price) * 100
            score += Math.min(discount, 30) // Max 30 points for discount
          }
          
          // Flash sale bonus
          if (product.is_flash_sale) {
            score += 15
          }

          productMap.set(product.id, {
            ...product,
            recommendationScore: score,
            recommendationReason: getRecommendationReason(product, categoryIds)
          })
        }
      }

      // Sort by score and take top results
      const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)

      recommendations.value = sortedProducts
      return sortedProducts

    } catch (error) {
      console.error('Error getting recommendations:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get recommendation reason text
  function getRecommendationReason(product, selectedCategoryIds) {
    if (product.is_flash_sale) {
      return 'Flash Sale!'
    }
    if (product.original_price) {
      const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100)
      return `ลด ${discount}%`
    }
    if (selectedCategoryIds.includes(product.category_id)) {
      return 'หมวดหมู่เดียวกัน'
    }
    return 'แนะนำสำหรับคุณ'
  }

  // Get frequently bought together products
  async function getFrequentlyBoughtTogether(productIds, limit = 4) {
    if (!productIds?.length) return []

    try {
      // Find orders that contain these products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds)

      if (!orderItems?.length) return []

      const orderIds = [...new Set(orderItems.map(i => i.order_id))]

      // Find other products in those orders
      const { data: relatedItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products (*)
        `)
        .in('order_id', orderIds)
        .not('product_id', 'in', `(${productIds.join(',')})`)

      // Count frequency
      const frequencyMap = new Map()
      for (const item of relatedItems || []) {
        if (item.products?.is_active) {
          const count = frequencyMap.get(item.product_id) || 0
          frequencyMap.set(item.product_id, {
            count: count + 1,
            product: item.products
          })
        }
      }

      // Sort by frequency
      const sorted = Array.from(frequencyMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => ({
          ...item.product,
          boughtTogetherCount: item.count,
          recommendationReason: `ซื้อคู่กัน ${item.count} ครั้ง`
        }))

      return sorted

    } catch (error) {
      console.error('Error getting frequently bought together:', error)
      return []
    }
  }

  // Get complementary products (e.g., drinks with snacks)
  async function getComplementaryProducts(categoryIds, limit = 4) {
    // Define complementary category pairs
    const complementaryMap = {
      // Food categories
      'snacks': ['drinks', 'beverages'],
      'drinks': ['snacks', 'food'],
      'food': ['drinks', 'snacks'],
      'instant-food': ['drinks', 'snacks'],
      // Personal care
      'personal-care': ['household'],
      'household': ['personal-care']
    }

    try {
      // Get category names
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)

      // Find complementary category IDs
      const complementaryCategoryNames = new Set()
      for (const cat of categories || []) {
        const complements = complementaryMap[cat.name.toLowerCase()] || []
        complements.forEach(c => complementaryCategoryNames.add(c))
      }

      if (complementaryCategoryNames.size === 0) return []

      // Get complementary category IDs
      const { data: complementaryCategories } = await supabase
        .from('categories')
        .select('id')
        .in('name', Array.from(complementaryCategoryNames))

      if (!complementaryCategories?.length) return []

      const complementaryCategoryIds = complementaryCategories.map(c => c.id)

      // Get products from complementary categories
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('category_id', complementaryCategoryIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (products || []).map(p => ({
        ...p,
        recommendationReason: 'สินค้าเสริม'
      }))

    } catch (error) {
      console.error('Error getting complementary products:', error)
      return []
    }
  }

  // Get all recommendations combined
  async function getAllRecommendations(selectedProductIds, limit = 8) {
    if (!selectedProductIds?.length) {
      recommendations.value = []
      return []
    }

    loading.value = true
    try {
      const [
        basicRecs,
        frequentlyBought,
      ] = await Promise.all([
        getRecommendations(selectedProductIds, Math.ceil(limit / 2)),
        getFrequentlyBoughtTogether(selectedProductIds, Math.ceil(limit / 2))
      ])

      // Combine and deduplicate
      const combined = [...frequentlyBought, ...basicRecs]
      const uniqueMap = new Map()
      
      for (const product of combined) {
        if (!uniqueMap.has(product.id)) {
          uniqueMap.set(product.id, product)
        }
      }

      const result = Array.from(uniqueMap.values()).slice(0, limit)
      recommendations.value = result
      return result

    } catch (error) {
      console.error('Error getting all recommendations:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // Clear recommendations
  function clearRecommendations() {
    recommendations.value = []
  }

  return {
    recommendations,
    loading,
    getRecommendations,
    getFrequentlyBoughtTogether,
    getComplementaryProducts,
    getAllRecommendations,
    clearRecommendations
  }
}
