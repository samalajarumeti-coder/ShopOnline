import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'
import { useAuthStore } from './auth'
import { useCartStore } from './cart'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)
  const isRealtimeConnected = ref(false)

  // Realtime subscription
  let ordersSubscription = null

  function handleOrderChange(payload) {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Only handle orders for current user
    if (newRecord?.user_id !== authStore.user.id && oldRecord?.user_id !== authStore.user.id) return

    if (eventType === 'INSERT') {
      orders.value.unshift(newRecord)
    } else if (eventType === 'UPDATE') {
      const idx = orders.value.findIndex(o => o.id === newRecord.id)
      if (idx !== -1) {
        orders.value[idx] = { ...orders.value[idx], ...newRecord }
      }
    } else if (eventType === 'DELETE') {
      orders.value = orders.value.filter(o => o.id !== oldRecord.id)
    }
  }

  function initRealtimeSubscription() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    ordersSubscription = supabase
      .channel('customer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleOrderChange)
      .subscribe()

    isRealtimeConnected.value = true
  }

  function unsubscribe() {
    if (ordersSubscription) supabase.removeChannel(ordersSubscription)
    isRealtimeConnected.value = false
  }

  async function fetchOrders() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      orders.value = data || []
    } catch (error) {
      handleSupabaseError(error, 'fetchOrders', false)
    } finally {
      loading.value = false
    }
  }

  async function createOrder(addressId, paymentMethod = 'cash', notes = '', couponId = null, discount = 0) {
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    
    if (!authStore.user) throw new Error('กรุณาเข้าสู่ระบบ')
    if (cartStore.items.length === 0) throw new Error('ตะกร้าว่างเปล่า')

    const subtotal = cartStore.totalPrice
    const subtotalAfterDiscount = Math.max(0, subtotal - discount)
    const deliveryFee = subtotalAfterDiscount >= 200 ? 0 : 30
    const total = subtotalAfterDiscount + deliveryFee

    // Prepare items for RPC
    const items = cartStore.items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }))

    try {
      // Try using RPC function first (bypasses RLS timing issues)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_with_items', {
        p_address_id: addressId,
      p_subtotal: subtotal,
      p_delivery_fee: deliveryFee,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_notes: notes || null,
      p_items: items
    })

    if (!rpcError && rpcResult) {
      // RPC succeeded
      const order = {
        id: rpcResult.id,
        user_id: rpcResult.user_id,
        status: rpcResult.status,
        total: rpcResult.total
      }
      
      // Mark coupon as used
      if (couponId) {
        await supabase
          .from('user_coupons')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('user_id', authStore.user.id)
          .eq('coupon_id', couponId)
          .catch(() => {})
      }

      cartStore.clearCart()
      currentOrder.value = order
      return order
    }

    // Fallback: direct insert (if RPC not available)
    console.log('RPC not available, using direct insert')
    
    const orderData = {
      user_id: authStore.user.id,
      address_id: addressId,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      discount: discount,
      total: total,
      payment_method: paymentMethod,
      notes: notes || null,
      status: 'pending'
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      throw orderError
    }
    
    // Mark coupon as used
    if (couponId) {
      await supabase
        .from('user_coupons')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('user_id', authStore.user.id)
        .eq('coupon_id', couponId)
        .catch(() => {})
    }

    // Create order items
    const orderItems = items.map(item => ({ ...item, order_id: order.id }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Don't throw - order was created, items failed
    }

    cartStore.clearCart()
    currentOrder.value = order
    return order
    } catch (error) {
      handleSupabaseError(error, 'createOrder', true)
    }
  }

  async function getOrder(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          addresses (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error, 'getOrder', true)
    }
  }

  async function cancelOrder(orderId, reason = '') {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('กรุณาเข้าสู่ระบบ')

    // Use RPC function to bypass RLS issues
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_reason: reason || null
    })

    if (error) {
      console.error('Cancel order RPC error:', error)
      // Fallback to direct update if RPC not available
      return await cancelOrderDirect(orderId, reason)
    }

    if (!data.success) {
      throw new Error(data.error || 'ไม่สามารถยกเลิกคำสั่งซื้อได้')
    }
    
    // Update local state
    const idx = orders.value.findIndex(o => o.id === orderId)
    if (idx !== -1) {
      orders.value[idx] = { ...orders.value[idx], status: 'cancelled' }
    }
    
    return data
  }

  // Fallback direct update (if RPC not available)
  async function cancelOrderDirect(orderId, reason = '') {
    const authStore = useAuthStore()
    
    // First check if order exists and is pending
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', orderId)
      .eq('user_id', authStore.user.id)
      .single()

    if (fetchError || !existingOrder) {
      throw new Error('ไม่พบคำสั่งซื้อนี้')
    }

    if (existingOrder.status !== 'pending') {
      throw new Error('ไม่สามารถยกเลิกคำสั่งซื้อที่ดำเนินการแล้ว')
    }

    const updateData = { 
      status: 'cancelled', 
      updated_at: new Date().toISOString()
    }
    
    if (reason) {
      updateData.notes = `[ยกเลิก: ${reason}]`
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('user_id', authStore.user.id)
      .select()

    if (error || !data || data.length === 0) {
      throw new Error('ไม่สามารถยกเลิกคำสั่งซื้อได้ กรุณารัน migration ใน Supabase')
    }
    
    // Update local state
    const idx = orders.value.findIndex(o => o.id === orderId)
    if (idx !== -1) {
      orders.value[idx] = { ...orders.value[idx], status: 'cancelled' }
    }
    
    return data[0]
  }

  return {
    orders,
    currentOrder,
    loading,
    isRealtimeConnected,
    fetchOrders,
    createOrder,
    getOrder,
    cancelOrder,
    initRealtimeSubscription,
    unsubscribe
  }
})
