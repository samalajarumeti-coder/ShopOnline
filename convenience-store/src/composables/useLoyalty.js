import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export function useLoyalty() {
  const authStore = useAuthStore()
  const userLoyalty = ref(null)
  const tiers = ref([])
  const transactions = ref([])
  const rewards = ref([])
  const userRewards = ref([])
  const challenges = ref([])
  const challengeProgress = ref([])
  const loading = ref(false)

  // Fetch user loyalty status
  const fetchUserLoyalty = async () => {
    if (!authStore.isLoggedIn) return

    try {
      const { data, error } = await supabase
        .from('user_loyalty')
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .eq('user_id', authStore.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user loyalty:', error)
        return
      }

      if (!data) {
        // Create initial loyalty record
        const { data: newLoyalty, error: insertError } = await supabase
          .from('user_loyalty')
          .insert({
            user_id: authStore.user.id,
            total_points: 0,
            available_points: 0,
            lifetime_points: 0
          })
          .select(`
            *,
            tier:loyalty_tiers(*)
          `)
          .single()

        if (insertError) throw insertError
        userLoyalty.value = newLoyalty
      } else {
        userLoyalty.value = data
      }
    } catch (error) {
      console.error('Error in fetchUserLoyalty:', error)
    }
  }

  // Fetch all tiers
  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('level')

      if (error) throw error
      tiers.value = data || []
    } catch (error) {
      console.error('Error fetching tiers:', error)
    }
  }

  // Fetch points transactions
  const fetchTransactions = async (limit = 50) => {
    if (!authStore.isLoggedIn) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      transactions.value = data || []
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      loading.value = false
    }
  }

  // Fetch available rewards
  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost')

      if (error) throw error
      rewards.value = data || []
    } catch (error) {
      console.error('Error fetching rewards:', error)
    }
  }

  // Fetch user's redeemed rewards
  const fetchUserRewards = async () => {
    if (!authStore.isLoggedIn) return

    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:loyalty_rewards(*)
        `)
        .eq('user_id', authStore.user.id)
        .order('redeemed_at', { ascending: false })

      if (error) throw error
      userRewards.value = data || []
    } catch (error) {
      console.error('Error fetching user rewards:', error)
    }
  }

  // Fetch active challenges
  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_challenges')
        .select('*')
        .eq('is_active', true)
        .or('start_date.is.null,start_date.lte.now()')
        .or('end_date.is.null,end_date.gte.now()')
        .order('reward_points', { ascending: false })

      if (error) throw error
      challenges.value = data || []
    } catch (error) {
      console.error('Error fetching challenges:', error)
    }
  }

  // Fetch user's challenge progress
  const fetchChallengeProgress = async () => {
    if (!authStore.isLoggedIn) return

    try {
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select(`
          *,
          challenge:loyalty_challenges(*)
        `)
        .eq('user_id', authStore.user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      challengeProgress.value = data || []
    } catch (error) {
      console.error('Error fetching challenge progress:', error)
    }
  }

  // Redeem reward
  const redeemReward = async (rewardId) => {
    try {
      const { data, error } = await supabase.rpc('redeem_loyalty_reward', {
        p_user_id: authStore.user.id,
        p_reward_id: rewardId
      })

      if (error) throw error

      // Refresh data
      await Promise.all([
        fetchUserLoyalty(),
        fetchUserRewards(),
        fetchTransactions()
      ])

      return data
    } catch (error) {
      console.error('Error redeeming reward:', error)
      throw error
    }
  }

  // Get next tier info
  const nextTier = computed(() => {
    if (!userLoyalty.value || !tiers.value.length) return null

    const currentLevel = userLoyalty.value.tier?.level || 1
    return tiers.value.find(t => t.level === currentLevel + 1)
  })

  // Progress to next tier
  const tierProgress = computed(() => {
    if (!userLoyalty.value || !nextTier.value) return 100

    const current = userLoyalty.value.total_points
    const min = userLoyalty.value.tier?.min_points || 0
    const max = nextTier.value.min_points

    return Math.min(100, ((current - min) / (max - min)) * 100)
  })

  // Points needed for next tier
  const pointsToNextTier = computed(() => {
    if (!userLoyalty.value || !nextTier.value) return 0
    return Math.max(0, nextTier.value.min_points - userLoyalty.value.total_points)
  })

  // Available rewards (user can afford)
  const affordableRewards = computed(() => {
    if (!userLoyalty.value) return []
    return rewards.value.filter(r => 
      r.points_cost <= userLoyalty.value.available_points &&
      (r.min_tier_level || 1) <= (userLoyalty.value.tier?.level || 1)
    )
  })

  // Active user rewards (not expired or used)
  const activeUserRewards = computed(() => {
    return userRewards.value.filter(r => r.status === 'active')
  })

  // Challenge progress with details
  const challengesWithProgress = computed(() => {
    return challenges.value.map(challenge => {
      const progress = challengeProgress.value.find(p => p.challenge_id === challenge.id)
      return {
        ...challenge,
        progress: progress || null,
        percentage: progress ? Math.min(100, (progress.current_value / challenge.target_value) * 100) : 0,
        isCompleted: progress?.completed || false
      }
    })
  })

  return {
    userLoyalty: computed(() => userLoyalty.value),
    tiers: computed(() => tiers.value),
    transactions: computed(() => transactions.value),
    rewards: computed(() => rewards.value),
    userRewards: computed(() => userRewards.value),
    challenges: computed(() => challenges.value),
    challengeProgress: computed(() => challengeProgress.value),
    nextTier,
    tierProgress,
    pointsToNextTier,
    affordableRewards,
    activeUserRewards,
    challengesWithProgress,
    loading: computed(() => loading.value),
    fetchUserLoyalty,
    fetchTiers,
    fetchTransactions,
    fetchRewards,
    fetchUserRewards,
    fetchChallenges,
    fetchChallengeProgress,
    redeemReward
  }
}
