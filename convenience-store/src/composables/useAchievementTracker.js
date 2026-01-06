import { ref } from 'vue'
import { useAchievementsStore } from '../stores/achievements'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useWishlistStore } from '../stores/wishlist'

export function useAchievementTracker() {
  const achievementsStore = useAchievementsStore()
  const authStore = useAuthStore()
  const ordersStore = useOrdersStore()
  const wishlistStore = useWishlistStore()

  const newAchievement = ref(null)
  const showToast = ref(false)

  // Calculate user stats
  const calculateStats = () => {
    const orders = ordersStore.orders
    const profile = authStore.profile

    return {
      ordersCount: orders.length,
      wishlistCount: wishlistStore.wishlistCount,
      totalSpent: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
      reviewsCount: 0, // TODO: Implement reviews
      referralsCount: 0, // TODO: Get from referrals table
      profileComplete: !!(
        profile?.full_name &&
        profile?.phone &&
        profile?.birth_date
      ),
      orderStreak: 0, // TODO: Calculate streak
      isBirthdayOrder: false, // TODO: Check if today is birthday
      orderHour: new Date().getHours()
    }
  }

  // Track order completion
  const trackOrderComplete = async () => {
    if (!authStore.isLoggedIn) return

    const stats = calculateStats()
    const newUnlocks = await achievementsStore.checkAchievements(stats)

    if (newUnlocks.length > 0) {
      // Show first achievement
      newAchievement.value = newUnlocks[0]
      showToast.value = true
    }
  }

  // Track wishlist add
  const trackWishlistAdd = async () => {
    if (!authStore.isLoggedIn) return

    const stats = calculateStats()
    await achievementsStore.checkAndUnlock('wishlist_10', stats)
  }

  // Track profile update
  const trackProfileUpdate = async () => {
    if (!authStore.isLoggedIn) return

    const stats = calculateStats()
    await achievementsStore.checkAndUnlock('complete_profile', stats)
  }

  // Track referral
  const trackReferral = async () => {
    if (!authStore.isLoggedIn) return

    const stats = calculateStats()
    await achievementsStore.checkAndUnlock('referral_1', stats)
  }

  // Close toast
  const closeToast = () => {
    showToast.value = false
    newAchievement.value = null
  }

  return {
    newAchievement,
    showToast,
    trackOrderComplete,
    trackWishlistAdd,
    trackProfileUpdate,
    trackReferral,
    closeToast
  }
}
