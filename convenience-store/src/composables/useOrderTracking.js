import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useOrderTracking() {
  const loading = ref(false)
  const error = ref(null)

  // Get order by tracking ID (public lookup)
  async function getOrderByTracking(trackingId) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .rpc('get_order_by_tracking', { p_tracking_id: trackingId })

      if (err) throw err
      return data?.[0] || null
    } catch (e) {
      error.value = e.message
      console.error('Error fetching order by tracking:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get tracking history for an order
  async function getTrackingHistory(orderId) {
    try {
      const { data, error: err } = await supabase
        .rpc('get_tracking_history', { p_order_id: orderId })

      if (err) throw err
      return data || []
    } catch (e) {
      console.error('Error fetching tracking history:', e)
      return []
    }
  }

  // Update order status (admin only)
  async function updateOrderStatus(orderId, status, options = {}) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .rpc('update_order_status', {
          p_order_id: orderId,
          p_status: status,
          p_notes: options.notes || null,
          p_driver_name: options.driverName || null,
          p_driver_phone: options.driverPhone || null,
          p_location: options.location || null,
          p_latitude: options.latitude || null,
          p_longitude: options.longitude || null
        })

      if (err) throw err
      if (!data?.success) throw new Error(data?.error || 'Failed to update status')
      
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Format tracking ID for display
  function formatTrackingId(trackingId) {
    if (!trackingId) return '-'
    return trackingId
  }

  // Get status label in Thai
  function getStatusLabel(status) {
    const labels = {
      pending: 'รอยืนยัน',
      confirmed: 'ยืนยันแล้ว',
      preparing: 'กำลังเตรียม',
      delivering: 'กำลังจัดส่ง',
      completed: 'สำเร็จ',
      cancelled: 'ยกเลิก'
    }
    return labels[status] || status
  }

  // Get status color classes
  function getStatusColor(status) {
    const colors = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
      delivering: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    }
    return colors[status] || colors.pending
  }

  // Calculate estimated delivery time
  function getEstimatedDelivery(createdAt, status) {
    if (status === 'completed' || status === 'cancelled') return null
    
    const created = new Date(createdAt)
    // Estimate 30-45 minutes from order creation
    const minTime = new Date(created.getTime() + 30 * 60 * 1000)
    const maxTime = new Date(created.getTime() + 45 * 60 * 1000)
    
    return {
      min: minTime,
      max: maxTime,
      formatted: `${minTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${maxTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  // Format timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Copy tracking ID to clipboard
  async function copyTrackingId(trackingId) {
    try {
      await navigator.clipboard.writeText(trackingId)
      return true
    } catch (e) {
      console.error('Failed to copy:', e)
      return false
    }
  }

  return {
    loading,
    error,
    getOrderByTracking,
    getTrackingHistory,
    updateOrderStatus,
    formatTrackingId,
    getStatusLabel,
    getStatusColor,
    getEstimatedDelivery,
    formatTimestamp,
    copyTrackingId
  }
}
