import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export function useLeaderboard() {
  const authStore = useAuthStore()
  const leaderboard = ref([])
  const myRank = ref(null)
  const leaderboardRewards = ref([])
  const loading = ref(false)

  // Fetch leaderboard
  const fetchLeaderboard = async (period = 'monthly', limit = 100) => {
    loading.value = true
    try {
      // Get current period dates
      const { periodStart, periodEnd } = getPeriodDates(period)

      const { data, error } = await supabase
        .from('loyalty_leaderboard')
        .select(`
          *,
          user:profiles!loyalty_leaderboard_user_id_fkey(full_name, email)
        `)
        .eq('period', period)
        .eq('period_start', periodStart.toISOString())
        .order('rank')
        .limit(limit)

      if (error) throw error
      leaderboard.value = data || []

      // Find current user's rank
      if (authStore.isLoggedIn) {
        const userEntry = leaderboard.value.find(entry => entry.user_id === authStore.user.id)
        myRank.value = userEntry || null
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      loading.value = false
    }
  }

  // Fetch leaderboard rewards
  const fetchLeaderboardRewards = async (period = 'monthly') => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_rewards')
        .select('*')
        .eq('period', period)
        .eq('is_active', true)
        .order('rank_from')

      if (error) throw error
      leaderboardRewards.value = data || []
    } catch (error) {
      console.error('Error fetching leaderboard rewards:', error)
    }
  }

  // Update leaderboard (admin only)
  const updateLeaderboard = async (period = 'monthly') => {
    try {
      const { periodStart, periodEnd } = getPeriodDates(period)

      const { error } = await supabase.rpc('update_leaderboard', {
        p_period: period,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString()
      })

      if (error) throw error
      await fetchLeaderboard(period)
    } catch (error) {
      console.error('Error updating leaderboard:', error)
      throw error
    }
  }

  // Get period dates
  const getPeriodDates = (period) => {
    const now = new Date()
    let periodStart, periodEnd

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + 1)
        break

      case 'weekly':
        const dayOfWeek = now.getDay()
        periodStart = new Date(now)
        periodStart.setDate(now.getDate() - dayOfWeek)
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + 7)
        break

      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break

      case 'all_time':
        periodStart = new Date(2024, 0, 1) // Start from 2024
        periodEnd = new Date(2099, 11, 31) // Far future
        break

      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    return { periodStart, periodEnd }
  }

  // Get reward for rank
  const getRewardForRank = (rank) => {
    return leaderboardRewards.value.find(
      reward => rank >= reward.rank_from && rank <= reward.rank_to
    )
  }

  // Top 3 leaders
  const topThree = computed(() => {
    return leaderboard.value.slice(0, 3)
  })

  // Top 10 leaders
  const topTen = computed(() => {
    return leaderboard.value.slice(0, 10)
  })

  // My position in leaderboard
  const myPosition = computed(() => {
    if (!myRank.value) return null
    return {
      ...myRank.value,
      reward: getRewardForRank(myRank.value.rank)
    }
  })

  // Am I in top 10?
  const isInTopTen = computed(() => {
    return myRank.value && myRank.value.rank <= 10
  })

  // Am I in top 3?
  const isInTopThree = computed(() => {
    return myRank.value && myRank.value.rank <= 3
  })

  // Format period label
  const formatPeriodLabel = (period) => {
    const labels = {
      daily: 'วันนี้',
      weekly: 'สัปดาห์นี้',
      monthly: 'เดือนนี้',
      all_time: 'ตลอดกาล'
    }
    return labels[period] || period
  }

  // Get rank badge
  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '🏆'
    if (rank <= 20) return '⭐'
    return '🎖️'
  }

  // Get rank color
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-400'
    if (rank === 3) return 'text-orange-600'
    if (rank <= 10) return 'text-purple-600'
    return 'text-gray-600'
  }

  return {
    leaderboard: computed(() => leaderboard.value),
    myRank: computed(() => myRank.value),
    myPosition,
    leaderboardRewards: computed(() => leaderboardRewards.value),
    topThree,
    topTen,
    isInTopTen,
    isInTopThree,
    loading: computed(() => loading.value),
    fetchLeaderboard,
    fetchLeaderboardRewards,
    updateLeaderboard,
    getRewardForRank,
    formatPeriodLabel,
    getRankBadge,
    getRankColor
  }
}
