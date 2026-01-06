import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const subscriptions = ref([])
const loading = ref(false)
const error = ref(null)

export function useSubscriptions() {
  const authStore = useAuthStore()

  // Active subscriptions
  const activeSubscriptions = computed(() => 
    subscriptions.value.filter(s => s.is_active)
  )

  // Fetch all subscriptions for current user
  async function fetchSubscriptions() {
    if (!authStore.user) {
      subscriptions.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_items (
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              image,
              is_active
            )
          ),
          addresses (
            id,
            label,
            address_line
          )
        `)
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (err) throw err
      subscriptions.value = data || []
    } catch (e) {
      error.value = e.message
      console.error('Error fetching subscriptions:', e)
    } finally {
      loading.value = false
    }
  }

  // Create new subscription
  async function createSubscription({
    name = 'รายการสั่งซื้อประจำ',
    frequency = 'weekly',
    nextDeliveryDate,
    addressId,
    paymentMethod = 'cash',
    autoConfirm = false,
    notes = '',
    items = [] // [{ productId, quantity }]
  }) {
    if (!authStore.user) throw new Error('กรุณาเข้าสู่ระบบ')
    if (items.length === 0) throw new Error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

    loading.value = true
    try {
      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: authStore.user.id,
          name,
          frequency,
          next_delivery_date: nextDeliveryDate,
          address_id: addressId,
          payment_method: paymentMethod,
          auto_confirm: autoConfirm,
          notes
        })
        .select()
        .single()

      if (subError) throw subError

      // Add items
      const itemsToInsert = items.map(item => ({
        subscription_id: subscription.id,
        product_id: item.productId,
        quantity: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('subscription_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      await fetchSubscriptions()
      return subscription
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update subscription
  async function updateSubscription(subscriptionId, updates) {
    loading.value = true
    try {
      const { error: err } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', authStore.user.id)

      if (err) throw err
      await fetchSubscriptions()
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Toggle subscription active status
  async function toggleSubscription(subscriptionId) {
    const subscription = subscriptions.value.find(s => s.id === subscriptionId)
    if (!subscription) return

    await updateSubscription(subscriptionId, {
      is_active: !subscription.is_active
    })
  }

  // Delete subscription
  async function deleteSubscription(subscriptionId) {
    loading.value = true
    try {
      const { error: err } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId)
        .eq('user_id', authStore.user.id)

      if (err) throw err
      subscriptions.value = subscriptions.value.filter(s => s.id !== subscriptionId)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Add item to subscription
  async function addItem(subscriptionId, productId, quantity = 1) {
    try {
      const { error: err } = await supabase
        .from('subscription_items')
        .upsert({
          subscription_id: subscriptionId,
          product_id: productId,
          quantity
        }, {
          onConflict: 'subscription_id,product_id'
        })

      if (err) throw err
      await fetchSubscriptions()
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Update item quantity
  async function updateItemQuantity(subscriptionId, productId, quantity) {
    if (quantity <= 0) {
      return removeItem(subscriptionId, productId)
    }

    try {
      const { error: err } = await supabase
        .from('subscription_items')
        .update({ quantity })
        .eq('subscription_id', subscriptionId)
        .eq('product_id', productId)

      if (err) throw err
      await fetchSubscriptions()
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Remove item from subscription
  async function removeItem(subscriptionId, productId) {
    try {
      const { error: err } = await supabase
        .from('subscription_items')
        .delete()
        .eq('subscription_id', subscriptionId)
        .eq('product_id', productId)

      if (err) throw err
      await fetchSubscriptions()
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Process subscription manually (create order now)
  async function processNow(subscriptionId) {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .rpc('process_subscription', { p_subscription_id: subscriptionId })

      if (err) throw err
      if (!data.success) throw new Error(data.error)

      await fetchSubscriptions()
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Skip next delivery
  async function skipNextDelivery(subscriptionId) {
    const subscription = subscriptions.value.find(s => s.id === subscriptionId)
    if (!subscription) return

    // Calculate new next delivery date
    const currentDate = new Date(subscription.next_delivery_date)
    let newDate

    switch (subscription.frequency) {
      case 'weekly':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 7))
        break
      case 'biweekly':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 14))
        break
      case 'monthly':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
        break
      default:
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 7))
    }

    // Record skipped delivery
    await supabase
      .from('subscription_orders')
      .insert({
        subscription_id: subscriptionId,
        scheduled_date: subscription.next_delivery_date,
        status: 'skipped'
      })

    await updateSubscription(subscriptionId, {
      next_delivery_date: newDate.toISOString().split('T')[0]
    })
  }

  // Get subscription history
  async function getHistory(subscriptionId) {
    const { data, error: err } = await supabase
      .from('subscription_orders')
      .select(`
        *,
        orders (
          id,
          status,
          total,
          created_at
        )
      `)
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (err) throw err
    return data || []
  }

  // Calculate estimated total for subscription
  function calculateTotal(subscription) {
    if (!subscription?.subscription_items) return 0
    
    return subscription.subscription_items.reduce((total, item) => {
      if (item.products?.is_active) {
        return total + (item.products.price * item.quantity)
      }
      return total
    }, 0)
  }

  // Calculate discount for subscription
  async function calculateDiscount(subscriptionId, subtotal) {
    try {
      const { data, error: err } = await supabase
        .rpc('calculate_subscription_discount', {
          p_subscription_id: subscriptionId,
          p_subtotal: subtotal
        })

      if (err) throw err
      return data?.[0] || {
        discount_percent: 5,
        discount_amount: subtotal * 0.05,
        final_total: subtotal * 0.95,
        discount_breakdown: { base_discount: 5 }
      }
    } catch (e) {
      console.error('Error calculating discount:', e)
      // Fallback to default 5% discount
      return {
        discount_percent: 5,
        discount_amount: subtotal * 0.05,
        final_total: subtotal * 0.95,
        discount_breakdown: { base_discount: 5, error: e.message }
      }
    }
  }

  // Get discount settings
  async function getDiscountSettings() {
    try {
      const { data, error: err } = await supabase
        .from('subscription_discount_settings')
        .select('*')
        .single()

      if (err) throw err
      return data
    } catch (e) {
      console.error('Error fetching discount settings:', e)
      return {
        default_discount_percent: 5,
        max_discount_percent: 15,
        loyalty_bonus_enabled: true,
        loyalty_bonus_percent: 2
      }
    }
  }

  // Update discount settings (admin only)
  async function updateDiscountSettings(settings) {
    try {
      const { data, error: err } = await supabase
        .from('subscription_discount_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (err) throw err
      return data
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Toggle discount for a subscription
  async function toggleDiscount(subscriptionId, enabled) {
    await updateSubscription(subscriptionId, {
      discount_enabled: enabled
    })
  }

  // Format frequency label
  function formatFrequency(frequency) {
    const labels = {
      weekly: 'ทุกสัปดาห์',
      biweekly: 'ทุก 2 สัปดาห์',
      monthly: 'ทุกเดือน'
    }
    return labels[frequency] || frequency
  }

  // Format next delivery date
  function formatNextDelivery(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'วันนี้'
    if (diffDays === 1) return 'พรุ่งนี้'
    if (diffDays < 7) return `อีก ${diffDays} วัน`

    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short'
    })
  }

  return {
    subscriptions,
    activeSubscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    toggleSubscription,
    deleteSubscription,
    addItem,
    updateItemQuantity,
    removeItem,
    processNow,
    skipNextDelivery,
    getHistory,
    calculateTotal,
    calculateDiscount,
    getDiscountSettings,
    updateDiscountSettings,
    toggleDiscount,
    formatFrequency,
    formatNextDelivery
  }
}
