import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const userTier = ref(null)
const allTiers = ref([])
const loading = ref(false)
const error = ref(null)

export function useSubscriptionTier() {
  const authStore = useAuthStore()

  // Tier colors for UI
  const tierColors = {
    bronze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', gradient: 'from-amber-400 to-amber-600' },
    silver: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', gradient: 'from-gray-300 to-gray-500' },
    gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400', gradient: 'from-yellow-400 to-yellow-600' },
    platinum: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', gradient: 'from-purple-400 to-purple-600' }
  }

  // Tier icons
  const tierIcons = {
    bronze: 'award',
    silver: 'medal',
    gold: 'crown',
    platinum: 'gem'
  }

  // Current tier info
  const currentTier = computed(() => userTier.value)

  // Progress to next tier
  const tierProgress = computed(() => {
    if (!userTier.value) return 0
    return userTier.value.progress_percent || 0
  })

  // Amount needed for next tier
  const amountToNextTier = computed(() => {
    if (!userTier.value || !userTier.value.next_tier_spending) return 0
    return Math.max(0, userTier.value.next_tier_spending - userTier.value.total_spending)
  })

  // Fetch user's current tier
  async function fetchUserTier() {
    if (!authStore.user) {
      userTier.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .rpc('get_user_subscription_tier', { p_user_id: authStore.user.id })

      if (err) throw err
      userTier.value = data?.[0] || null
    } catch (e) {
      error.value = e.message
      console.error('Error fetching user tier:', e)
    } finally {
      loading.value = false
    }
  }

  // Fetch all available tiers
  async function fetchAllTiers() {
    try {
      const { data, error: err } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (err) throw err
      allTiers.value = data || []
    } catch (e) {
      console.error('Error fetching tiers:', e)
    }
  }

  // Get tier by name
  function getTierByName(name) {
    return allTiers.value.find(t => t.name === name)
  }

  // Get tier color classes
  function getTierColors(tierName) {
    return tierColors[tierName] || tierColors.bronze
  }

  // Get tier icon
  function getTierIcon(tierName) {
    return tierIcons[tierName] || 'award'
  }

  // Format spending
  function formatSpending(amount) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Get tier benefits as array
  function getTierBenefits(tier) {
    if (!tier?.benefits) return []
    return Array.isArray(tier.benefits) ? tier.benefits : []
  }

  // Check if user has specific tier or higher
  function hasTierOrHigher(tierName) {
    if (!userTier.value) return false
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
    const userTierIndex = tierOrder.indexOf(userTier.value.tier_name)
    const checkTierIndex = tierOrder.indexOf(tierName)
    return userTierIndex >= checkTierIndex
  }

  // Get total discount (base + tier bonus)
  function getTotalDiscount(baseDiscount = 5) {
    const tierBonus = userTier.value?.discount_bonus || 0
    return baseDiscount + tierBonus
  }

  // Fetch tier history
  async function fetchTierHistory() {
    if (!authStore.user) return []

    try {
      const { data, error: err } = await supabase
        .from('subscription_tier_history')
        .select(`
          *,
          from_tier:from_tier_id (name, display_name, color),
          to_tier:to_tier_id (name, display_name, color)
        `)
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (err) throw err
      return data || []
    } catch (e) {
      console.error('Error fetching tier history:', e)
      return []
    }
  }

  return {
    userTier,
    allTiers,
    loading,
    error,
    currentTier,
    tierProgress,
    amountToNextTier,
    fetchUserTier,
    fetchAllTiers,
    getTierByName,
    getTierColors,
    getTierIcon,
    formatSpending,
    getTierBenefits,
    hasTierOrHigher,
    getTotalDiscount,
    fetchTierHistory
  }
}
