import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

export function useReferral() {
  const authStore = useAuthStore()
  const referralCode = ref(null)
  const referrals = ref([])
  const loading = ref(false)

  // Get user's referral code
  const fetchReferralCode = async () => {
    if (!authStore.isLoggedIn) return

    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching referral code:', error)
        return
      }

      if (!data) {
        // Generate new code
        const code = await generateCode()
        referralCode.value = code
      } else {
        referralCode.value = data
      }
    } catch (error) {
      console.error('Error in fetchReferralCode:', error)
    }
  }

  // Generate referral code
  const generateCode = async () => {
    try {
      const { data: codeStr, error: rpcError } = await supabase.rpc('generate_referral_code', {
        p_user_id: authStore.user.id
      })

      if (rpcError) throw rpcError

      // Insert code
      const { data: newCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: authStore.user.id,
          code: codeStr
        })
        .select()
        .single()

      if (insertError) throw insertError
      return newCode
    } catch (error) {
      console.error('Error generating code:', error)
      throw error
    }
  }

  // Get referral stats
  const fetchReferrals = async () => {
    if (!authStore.isLoggedIn) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:profiles!referrals_referred_id_fkey(full_name, email)
        `)
        .eq('referrer_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      referrals.value = data || []
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      loading.value = false
    }
  }

  // Apply referral code (for new users)
  const applyReferralCode = async (code) => {
    try {
      const { error } = await supabase.rpc('process_referral', {
        p_referred_id: authStore.user.id,
        p_referral_code: code.toUpperCase()
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error applying referral code:', error)
      throw error
    }
  }

  // Share referral link
  const shareReferral = async () => {
    if (!referralCode.value) return

    const url = `${window.location.origin}/register?ref=${referralCode.value.code}`
    const text = `ใช้โค้ด ${referralCode.value.code} สมัครสมาชิกรับคะแนนฟรี ${referralCode.value.referred_reward_points || 50} คะแนน!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ชวนเพื่อนรับคะแนน',
          text,
          url
        })
      } catch (e) {
        if (e.name !== 'AbortError') {
          await navigator.clipboard.writeText(url)
          alert('คัดลอกลิงก์แล้ว!')
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('คัดลอกลิงก์แล้ว!')
    }
  }

  // Copy referral code
  const copyCode = async () => {
    if (!referralCode.value) return

    try {
      await navigator.clipboard.writeText(referralCode.value.code)
      return true
    } catch (error) {
      console.error('Error copying code:', error)
      return false
    }
  }

  const stats = computed(() => ({
    totalReferrals: referrals.value.length,
    completedReferrals: referrals.value.filter(r => r.status === 'rewarded').length,
    pendingReferrals: referrals.value.filter(r => r.status === 'pending').length,
    totalEarned: referrals.value
      .filter(r => r.status === 'rewarded')
      .reduce((sum, r) => sum + (r.referrer_reward_points || 0), 0)
  }))

  const referralUrl = computed(() => {
    if (!referralCode.value) return ''
    return `${window.location.origin}/register?ref=${referralCode.value.code}`
  })

  return {
    referralCode: computed(() => referralCode.value),
    referrals: computed(() => referrals.value),
    referralUrl,
    stats,
    loading: computed(() => loading.value),
    fetchReferralCode,
    fetchReferrals,
    applyReferralCode,
    shareReferral,
    copyCode
  }
}
