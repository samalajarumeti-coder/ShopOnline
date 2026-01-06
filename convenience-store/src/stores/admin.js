import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'

export const useAdminStore = defineStore('admin', () => {
  const products = ref([])
  const categories = ref([])
  const orders = ref([])
  const coupons = ref([])
  const banners = ref([])
  const stats = ref({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0
  })
  const loading = ref(false)
  const error = ref(null)
  const isRealtimeConnected = ref(false)
  
  // Realtime subscriptions
  let productsSubscription = null
  let categoriesSubscription = null
  let ordersSubscription = null
  let couponsSubscription = null
  let bannersSubscription = null

  // Subscribe to realtime updates
  function subscribeToProducts() {
    productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        handleRealtimeChange(products, payload)
      })
      .subscribe()
  }

  function subscribeToCategories() {
    categoriesSubscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        handleRealtimeChange(categories, payload)
      })
      .subscribe()
  }

  function subscribeToOrders() {
    ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        handleRealtimeChange(orders, payload)
        // Refresh stats when orders change
        fetchDashboardStats()
      })
      .subscribe()
  }

  function subscribeToCoupons() {
    couponsSubscription = supabase
      .channel('coupons-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, (payload) => {
        handleRealtimeChange(coupons, payload)
      })
      .subscribe()
  }

  function subscribeToBanners() {
    bannersSubscription = supabase
      .channel('banners-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, (payload) => {
        handleRealtimeChange(banners, payload)
      })
      .subscribe()
  }

  function handleRealtimeChange(dataRef, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'INSERT') {
      dataRef.value.unshift(newRecord)
    } else if (eventType === 'UPDATE') {
      const idx = dataRef.value.findIndex(item => item.id === newRecord.id)
      if (idx !== -1) {
        dataRef.value[idx] = { ...dataRef.value[idx], ...newRecord }
      }
    } else if (eventType === 'DELETE') {
      dataRef.value = dataRef.value.filter(item => item.id !== oldRecord.id)
    }
  }

  // Unsubscribe all
  function unsubscribeAll() {
    if (productsSubscription) supabase.removeChannel(productsSubscription)
    if (categoriesSubscription) supabase.removeChannel(categoriesSubscription)
    if (ordersSubscription) supabase.removeChannel(ordersSubscription)
    if (couponsSubscription) supabase.removeChannel(couponsSubscription)
    if (bannersSubscription) supabase.removeChannel(bannersSubscription)
  }

  // Initialize all subscriptions
  function initRealtimeSubscriptions() {
    subscribeToProducts()
    subscribeToCategories()
    subscribeToOrders()
    subscribeToCoupons()
    subscribeToBanners()
    isRealtimeConnected.value = true
  }

  // Dashboard Stats
  async function fetchDashboardStats() {
    loading.value = true
    error.value = null
    try {
      // Total orders & revenue
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
      
      if (ordersError) {
        console.warn('Orders fetch error:', ordersError)
      }
      
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = ordersData?.filter(o => o.created_at?.startsWith(today)) || []
      
      stats.value = {
        totalOrders: ordersData?.length || 0,
        totalRevenue: ordersData?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0,
        pendingOrders: ordersData?.filter(o => o.status === 'pending').length || 0,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        totalProducts: 0,
        totalCustomers: 0
      }

      // Total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      stats.value.totalProducts = productsCount || 0

      // Total customers (may fail due to RLS)
      try {
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        stats.value.totalCustomers = customersCount || 0
      } catch (e) {
        stats.value.totalCustomers = 0
      }

    } catch (e) {
      console.error('Dashboard stats error:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Products CRUD
  async function fetchAllProducts() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })
      
      if (err) {
        console.error('Products fetch error:', err)
        products.value = []
        return
      }
      products.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createProduct(product) {
    const { data, error: err } = await supabase
      .from('products')
      .insert(product)
      .select('*, categories(name)')
    
    if (err) throw err
    if (data && data.length > 0) {
      products.value.unshift(data[0])
      return data[0]
    }
    return null
  }

  async function updateProduct(id, updates) {
    // Remove non-column fields from updates
    const { categories: _, id: __, created_at: ___, ...cleanUpdates } = updates
    const { data, error: err } = await supabase
      .from('products')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(name)')
    
    if (err) throw err
    if (data && data.length > 0) {
      const idx = products.value.findIndex(p => p.id === id)
      if (idx !== -1) products.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  async function deleteProduct(id) {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) throw err
    products.value = products.value.filter(p => p.id !== id)
  }

  // Categories CRUD
  async function fetchAllCategories() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (err) {
        console.error('Categories fetch error:', err)
        categories.value = []
        return
      }
      categories.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createCategory(category) {
    const { data, error: err } = await supabase
      .from('categories')
      .insert(category)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      categories.value.push(data[0])
      return data[0]
    }
    return null
  }

  async function updateCategory(id, updates) {
    const { data, error: err } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx !== -1) categories.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  async function deleteCategory(id) {
    const { error: err } = await supabase.from('categories').delete().eq('id', id)
    if (err) throw err
    categories.value = categories.value.filter(c => c.id !== id)
  }

  // Orders Management
  async function fetchAllOrders() {
    loading.value = true
    error.value = null
    try {
      console.log('[AdminStore] Fetching all orders...')
      
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items (*), addresses (*)')
        .order('created_at', { ascending: false })
      
      if (err) {
        console.error('[AdminStore] Orders fetch error:', err)
        error.value = err.message
        orders.value = []
        return
      }
      
      console.log('[AdminStore] Orders fetched:', data?.length || 0, 'records')
      orders.value = data || []
    } catch (e) {
      console.error('[AdminStore] Orders fetch exception:', e)
      error.value = e.message
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  async function updateOrderStatus(id, status) {
    const { data, error: err } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      const idx = orders.value.findIndex(o => o.id === id)
      if (idx !== -1) orders.value[idx].status = status
      return data[0]
    }
    return null
  }

  async function updateOrder(id, updates) {
    const { data, error: err } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, order_items (*), addresses (*)')
    if (err) throw err
    if (data && data.length > 0) {
      const idx = orders.value.findIndex(o => o.id === id)
      if (idx !== -1) orders.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  async function deleteOrder(id) {
    // Delete order items first (cascade should handle this but just in case)
    await supabase.from('order_items').delete().eq('order_id', id)
    const { error: err } = await supabase.from('orders').delete().eq('id', id)
    if (err) throw err
    orders.value = orders.value.filter(o => o.id !== id)
  }

  // Order Items Management
  async function updateOrderItem(itemId, updates) {
    const { data, error: err } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId)
      .select()
    if (err) throw err
    return data?.[0] || null
  }

  async function deleteOrderItem(itemId) {
    const { error: err } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    if (err) throw err
  }

  async function recalculateOrderTotals(orderId) {
    // Fetch current order items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (itemsErr) throw itemsErr

    // Calculate new subtotal
    const subtotal = items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0
    
    // Get current order for delivery_fee and discount
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('delivery_fee, discount')
      .eq('id', orderId)
      .single()
    
    if (orderErr) throw orderErr

    const deliveryFee = Number(orderData?.delivery_fee || 0)
    const discount = Number(orderData?.discount || 0)
    const total = subtotal + deliveryFee - discount

    // Update order totals
    const { data, error: updateErr } = await supabase
      .from('orders')
      .update({ 
        subtotal, 
        total,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select('*, order_items (*), addresses (*)')
    
    if (updateErr) throw updateErr

    // Update local state
    if (data && data.length > 0) {
      const idx = orders.value.findIndex(o => o.id === orderId)
      if (idx !== -1) orders.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  // Add new item to order
  async function addOrderItem(orderId, product, quantity = 1) {
    const subtotal = product.price * quantity
    const { data, error: err } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        product_image: product.image,
        quantity,
        subtotal
      })
      .select()
    
    if (err) throw err
    return data?.[0] || null
  }

  // Log order activity for audit trail
  async function logOrderActivity(action, orderId, details = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.rpc('log_activity', {
        p_action: action,
        p_entity_type: 'order',
        p_entity_id: String(orderId),
        p_old_value: details.oldValue ? JSON.stringify(details.oldValue) : null,
        p_new_value: details.newValue ? JSON.stringify(details.newValue) : null
      })
    } catch (e) {
      console.warn('Failed to log activity:', e)
    }
  }

  // Coupons CRUD
  async function fetchAllCoupons() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (err) {
        console.error('Coupons fetch error:', err)
        coupons.value = []
        return
      }
      coupons.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createCoupon(coupon) {
    const { data, error: err } = await supabase
      .from('coupons')
      .insert(coupon)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      coupons.value.unshift(data[0])
      return data[0]
    }
    return null
  }

  async function updateCoupon(id, updates) {
    const { data, error: err } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      const idx = coupons.value.findIndex(c => c.id === id)
      if (idx !== -1) coupons.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  async function deleteCoupon(id) {
    const { error: err } = await supabase.from('coupons').delete().eq('id', id)
    if (err) throw err
    coupons.value = coupons.value.filter(c => c.id !== id)
  }

  // Banners CRUD
  async function fetchAllBanners() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order')
      
      if (err) {
        console.error('Banners fetch error:', err)
        banners.value = []
        return
      }
      banners.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createBanner(banner) {
    const { data, error: err } = await supabase
      .from('banners')
      .insert(banner)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      banners.value.push(data[0])
      return data[0]
    }
    return null
  }

  async function updateBanner(id, updates) {
    const { data, error: err } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
    if (err) throw err
    if (data && data.length > 0) {
      const idx = banners.value.findIndex(b => b.id === id)
      if (idx !== -1) banners.value[idx] = data[0]
      return data[0]
    }
    return null
  }

  async function deleteBanner(id) {
    const { error: err } = await supabase.from('banners').delete().eq('id', id)
    if (err) throw err
    banners.value = banners.value.filter(b => b.id !== id)
  }

  return {
    products, categories, orders, coupons, banners, stats, loading, error, isRealtimeConnected,
    fetchDashboardStats,
    fetchAllProducts, createProduct, updateProduct, deleteProduct,
    fetchAllCategories, createCategory, updateCategory, deleteCategory,
    fetchAllOrders, updateOrderStatus, updateOrder, deleteOrder,
    updateOrderItem, deleteOrderItem, recalculateOrderTotals, addOrderItem, logOrderActivity,
    fetchAllCoupons, createCoupon, updateCoupon, deleteCoupon,
    fetchAllBanners, createBanner, updateBanner, deleteBanner,
    initRealtimeSubscriptions, unsubscribeAll
  }
})
