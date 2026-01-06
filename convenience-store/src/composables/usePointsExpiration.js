import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export function usePointsExpiration() {
  const authStore = useAuthStore()
  const expiringPoints = ref([])
  const loading = ref(false)

  // Fetch expiring points
  const fetchExpiringPoints = async (daysAhead = 30) => {
    if (!authStore.isLoggedIn) return

    loading.value = true
    try {
      const { data, error } = await supabase.rpc('get_expiring_points', {
        p_user_id: authStore.user.id,
        p_days_ahead: daysAhead
      })

      if (error) throw error
      expiringPoints.value = data || []
    } catch (error) {
      console.error('Error fetching expiring points:', error)
    } finally {
      loading.value = false
    }
  }

  // Total expiring points
  const totalExpiringPoints = computed(() => {
    return expiringPoints.value.reduce((sum, item) => sum + item.points, 0)
  })

  // Points expiring soon (within 7 days)
  const urgentExpiringPoints = computed(() => {
    return expiringPoints.value.filter(item => item.days_remaining <= 7)
  })

  // Total urgent points
  const totalUrgentPoints = computed(() => {
    return urgentExpiringPoints.value.reduce((sum, item) => sum + item.points, 0)
  })

  // Has expiring points
  const hasExpiringPoints = computed(() => {
    return expiringPoints.value.length > 0
  })

  // Has urgent expiring points
  const hasUrgentPoints = computed(() => {
    return urgentExpiringPoints.value.length > 0
  })

  // Group by urgency
  const groupedByUrgency = computed(() => {
    const groups = {
      urgent: [], // <= 7 days
      warning: [], // 8-14 days
      normal: []   // 15-30 days
    }

    expiringPoints.value.forEach(item => {
      if (item.days_remaining <= 7) {
        groups.urgent.push(item)
      } else if (item.days_remaining <= 14) {
        groups.warning.push(item)
      } else {
        groups.normal.push(item)
      }
    })

    return groups
  })

  // Format expiry date
  const formatExpiryDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get urgency level
  const getUrgencyLevel = (daysRemaining) => {
    if (daysRemaining <= 7) return 'urgent'
    if (daysRemaining <= 14) return 'warning'
    return 'normal'
  }

  // Get urgency color
  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining <= 7) return 'text-red-600'
    if (daysRemaining <= 14) return 'text-orange-600'
    return 'text-yellow-600'
  }

  // Get urgency badge color
  const getUrgencyBadgeColor = (daysRemaining) => {
    if (daysRemaining <= 7) return 'bg-red-100 text-red-800'
    if (daysRemaining <= 14) return 'bg-orange-100 text-orange-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  return {
    expiringPoints: computed(() => expiringPoints.value),
    totalExpiringPoints,
    urgentExpiringPoints,
    totalUrgentPoints,
    hasExpiringPoints,
    hasUrgentPoints,
    groupedByUrgency,
    loading: computed(() => loading.value),
    fetchExpiringPoints,
    formatExpiryDate,
    getUrgencyLevel,
    getUrgencyColor,
    getUrgencyBadgeColor
  }
}
