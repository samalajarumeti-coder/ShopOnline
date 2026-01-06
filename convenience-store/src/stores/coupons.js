import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'
import { useAuthStore } from './auth'

export const useCouponsStore = defineStore('coupons', () => {
  const availableCoupons = ref([])
  const myCoupons = ref([])
  const loading = ref(false)
  const isRealtimeConnected = ref(false)

  // Realtime subscription
  let couponsSubscription = null

  function handleCouponChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const now = new Date().toISOString()

    if (eventType === 'INSERT' && newRecord.is_active && newRecord.valid_until >= now) {
      availableCoupons.value.push(newRecord)
    } else if (eventType === 'UPDATE') {
      const idx = availableCoupons.value.findIndex(c => c.id === newRecord.id)
      if (newRecord.is_active && newRecord.valid_until >= now) {
        if (idx !== -1) {
          availableCoupons.value[idx] = newRecord
        } else {
          availableCoupons.value.push(newRecord)
        }
      } else if (idx !== -1) {
        availableCoupons.value.splice(idx, 1)
      }
    } else if (eventType === 'DELETE') {
      availableCoupons.value = availableCoupons.value.filter(c => c.id !== oldRecord.id)
    }
  }

  function initRealtimeSubscription() {
    couponsSubscription = supabase
      .channel('customer-coupons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, handleCouponChange)
      .subscribe()

    isRealtimeConnected.value = true
  }

  function unsubscribe() {
    if (couponsSubscription) supabase.removeChannel(couponsSubscription)
    isRealtimeConnected.value = false
  }

  async function fetchAvailableCoupons() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
      
      if (error) throw error
      availableCoupons.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchMyCoupons() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon:coupons (*)
      `)
      .eq('user_id', authStore.user.id)
      .eq('is_used', false)

    if (error) throw error
    myCoupons.value = data || []
  }

  async function claimCoupon(couponId) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('กรุณาเข้าสู่ระบบ')

    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: authStore.user.id,
        coupon_id: couponId
      })
      .select(`
        *,
        coupon:coupons (*)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('คุณได้รับคูปองนี้แล้ว')
      }
      throw error
    }
    
    myCoupons.value.push(data)
    return data
  }

  async function applyCoupon(code, orderTotal) {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single()

    if (error || !coupon) {
      throw new Error('คูปองไม่ถูกต้องหรือหมดอายุ')
    }

    if (orderTotal < coupon.min_order) {
      throw new Error(`ยอดสั่งซื้อขั้นต่ำ ฿${coupon.min_order}`)
    }

    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = (orderTotal * coupon.discount_value) / 100
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount)
      }
    } else {
      discount = coupon.discount_value
    }

    return { coupon, discount }
  }

  return {
    availableCoupons,
    myCoupons,
    loading,
    isRealtimeConnected,
    fetchAvailableCoupons,
    fetchMyCoupons,
    claimCoupon,
    applyCoupon,
    initRealtimeSubscription,
    unsubscribe
  }
})
