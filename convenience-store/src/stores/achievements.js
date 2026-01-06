import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const useAchievementsStore = defineStore('achievements', () => {
  const achievements = ref([])
  const userAchievements = ref([])
  const loading = ref(false)

  // Define all available achievements
  const allAchievements = [
    {
      id: 'first_order',
      title: 'คำสั่งซื้อแรก',
      description: 'ทำการสั่งซื้อครั้งแรกสำเร็จ',
      icon: '🎉',
      points: 50,
      requirement: { type: 'orders_count', value: 1 }
    },
    {
      id: 'order_5',
      title: 'ลูกค้าประจำ',
      description: 'สั่งซื้อครบ 5 ครั้ง',
      icon: '⭐',
      points: 100,
      requirement: { type: 'orders_count', value: 5 }
    },
    {
      id: 'order_10',
      title: 'ลูกค้า VIP',
      description: 'สั่งซื้อครบ 10 ครั้ง',
      icon: '👑',
      points: 200,
      requirement: { type: 'orders_count', value: 10 }
    },
    {
      id: 'order_50',
      title: 'ตำนานแห่งการช้อป',
      description: 'สั่งซื้อครบ 50 ครั้ง',
      icon: '🏆',
      points: 500,
      requirement: { type: 'orders_count', value: 50 }
    },
    {
      id: 'wishlist_10',
      title: 'นักสะสม',
      description: 'เพิ่มสินค้าในรายการโปรดครบ 10 รายการ',
      icon: '❤️',
      points: 50,
      requirement: { type: 'wishlist_count', value: 10 }
    },
    {
      id: 'spend_1000',
      title: 'นักช้อปมือใหม่',
      description: 'ใช้จ่ายรวมครบ 1,000 บาท',
      icon: '💰',
      points: 100,
      requirement: { type: 'total_spent', value: 1000 }
    },
    {
      id: 'spend_5000',
      title: 'นักช้อปมืออาชีพ',
      description: 'ใช้จ่ายรวมครบ 5,000 บาท',
      icon: '💎',
      points: 300,
      requirement: { type: 'total_spent', value: 5000 }
    },
    {
      id: 'spend_10000',
      title: 'เศรษฐีแห่งการช้อป',
      description: 'ใช้จ่ายรวมครบ 10,000 บาท',
      icon: '🌟',
      points: 500,
      requirement: { type: 'total_spent', value: 10000 }
    },
    {
      id: 'early_bird',
      title: 'นกตื่นเช้า',
      description: 'สั่งซื้อก่อน 8 โมงเช้า',
      icon: '🌅',
      points: 30,
      requirement: { type: 'order_time', value: 'before_8am' }
    },
    {
      id: 'night_owl',
      title: 'นกฮูกกลางคืน',
      description: 'สั่งซื้อหลัง 10 โมงเย็น',
      icon: '🦉',
      points: 30,
      requirement: { type: 'order_time', value: 'after_10pm' }
    },
    {
      id: 'review_master',
      title: 'นักรีวิว',
      description: 'เขียนรีวิวสินค้าครบ 5 รายการ',
      icon: '✍️',
      points: 100,
      requirement: { type: 'reviews_count', value: 5 }
    },
    {
      id: 'referral_1',
      title: 'ผู้แนะนำ',
      description: 'แนะนำเพื่อนสมัครสมาชิก 1 คน',
      icon: '🤝',
      points: 150,
      requirement: { type: 'referrals_count', value: 1 }
    },
    {
      id: 'birthday_order',
      title: 'วันเกิดมีความสุข',
      description: 'สั่งซื้อในวันเกิดของคุณ',
      icon: '🎂',
      points: 200,
      requirement: { type: 'birthday_order', value: true }
    },
    {
      id: 'streak_7',
      title: 'สัปดาห์ทอง',
      description: 'สั่งซื้อติดต่อกัน 7 วัน',
      icon: '🔥',
      points: 250,
      requirement: { type: 'order_streak', value: 7 }
    },
    {
      id: 'complete_profile',
      title: 'โปรไฟล์สมบูรณ์',
      description: 'กรอกข้อมูลโปรไฟล์ครบถ้วน',
      icon: '✅',
      points: 50,
      requirement: { type: 'profile_complete', value: true }
    }
  ]

  const unlockedCount = computed(() => userAchievements.value.length)
  const totalPoints = computed(() => 
    userAchievements.value.reduce((sum, a) => sum + (a.points || 0), 0)
  )
  const progress = computed(() => 
    Math.round((unlockedCount.value / allAchievements.length) * 100)
  )

  // Check if achievement is unlocked
  function isUnlocked(achievementId) {
    return userAchievements.value.some(a => a.achievement_id === achievementId)
  }

  // Get achievement details
  function getAchievement(achievementId) {
    return allAchievements.find(a => a.id === achievementId)
  }

  // Fetch user achievements
  async function fetchUserAchievements() {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('unlocked_at', { ascending: false })

      if (error) throw error
      userAchievements.value = data || []
    } catch (e) {
      console.error('Error fetching achievements:', e)
    } finally {
      loading.value = false
    }
  }

  // Check and unlock achievement
  async function checkAndUnlock(achievementId, stats) {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || isUnlocked(achievementId)) return false

    const achievement = getAchievement(achievementId)
    if (!achievement) return false

    // Check if requirement is met
    const { type, value } = achievement.requirement
    let requirementMet = false

    switch (type) {
      case 'orders_count':
        requirementMet = stats.ordersCount >= value
        break
      case 'wishlist_count':
        requirementMet = stats.wishlistCount >= value
        break
      case 'total_spent':
        requirementMet = stats.totalSpent >= value
        break
      case 'reviews_count':
        requirementMet = stats.reviewsCount >= value
        break
      case 'referrals_count':
        requirementMet = stats.referralsCount >= value
        break
      case 'profile_complete':
        requirementMet = stats.profileComplete === true
        break
      case 'order_streak':
        requirementMet = stats.orderStreak >= value
        break
      case 'birthday_order':
        requirementMet = stats.isBirthdayOrder === true
        break
      case 'order_time':
        if (value === 'before_8am') {
          requirementMet = stats.orderHour < 8
        } else if (value === 'after_10pm') {
          requirementMet = stats.orderHour >= 22
        }
        break
    }

    if (!requirementMet) return false

    // Unlock achievement
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: authStore.user.id,
          achievement_id: achievementId,
          points: achievement.points
        })
        .select()
        .single()

      if (error) throw error

      userAchievements.value.unshift(data)

      // Award points to user profile
      await authStore.updateProfile({
        points: (authStore.profile?.points || 0) + achievement.points
      })

      return true
    } catch (e) {
      console.error('Error unlocking achievement:', e)
      return false
    }
  }

  // Check multiple achievements at once
  async function checkAchievements(stats) {
    const newUnlocks = []
    
    for (const achievement of allAchievements) {
      const unlocked = await checkAndUnlock(achievement.id, stats)
      if (unlocked) {
        newUnlocks.push(achievement)
      }
    }

    return newUnlocks
  }

  return {
    achievements,
    userAchievements,
    allAchievements,
    loading,
    unlockedCount,
    totalPoints,
    progress,
    isUnlocked,
    getAchievement,
    fetchUserAchievements,
    checkAndUnlock,
    checkAchievements
  }
})
