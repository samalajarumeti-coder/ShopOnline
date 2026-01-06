import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError, safeAsync } from '../lib/errorHandler'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const forceLogoutReason = ref(null)
  
  // Role cache with TTL (5 minutes)
  const roleCache = ref({
    role: null,
    cachedAt: null,
    ttl: 5 * 60 * 1000 // 5 minutes in milliseconds
  })

  // Realtime subscriptions
  let profileSubscription = null
  let forceLogoutSubscription = null

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => getCachedRole() === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(getCachedRole()))
  const isStaff = computed(() => ['admin', 'manager', 'staff'].includes(getCachedRole()))
  const userRole = computed(() => getCachedRole())

  // Get cached role or return from profile
  function getCachedRole() {
    const now = Date.now()
    if (roleCache.value.role && roleCache.value.cachedAt && 
        (now - roleCache.value.cachedAt) < roleCache.value.ttl) {
      return roleCache.value.role
    }
    // Cache expired or not set, use profile role
    const role = profile.value?.role || 'customer'
    updateRoleCache(role)
    return role
  }

  // Update role cache
  function updateRoleCache(role) {
    roleCache.value = {
      ...roleCache.value,
      role,
      cachedAt: Date.now()
    }
  }

  // Clear role cache (call when role changes)
  function clearRoleCache() {
    roleCache.value = {
      ...roleCache.value,
      role: null,
      cachedAt: null
    }
  }

  // Subscribe to profile changes for realtime role updates
  function subscribeToProfileChanges() {
    if (!user.value || profileSubscription) return

    profileSubscription = supabase
      .channel(`profile-${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.value.id}`
        },
        (payload) => {
          const newProfile = payload.new
          profile.value = newProfile
          
          // Update role cache immediately
          if (newProfile?.role) {
            const oldRole = roleCache.value.role
            updateRoleCache(newProfile.role)
            
            // If role was downgraded, show notification
            if (oldRole && oldRole !== newProfile.role) {
              console.log(`Role changed from ${oldRole} to ${newProfile.role}`)
            }
          }
        }
      )
      .subscribe()
  }

  // Subscribe to force logout broadcast channel
  function subscribeToForceLogout() {
    if (!user.value || forceLogoutSubscription) return

    forceLogoutSubscription = supabase
      .channel('force-logout')
      .on('broadcast', { event: 'force_logout' }, async (payload) => {
        const { user_id, reason } = payload.payload || {}
        
        // Check if this logout is for current user
        if (user_id === user.value?.id) {
          forceLogoutReason.value = reason || 'บัญชีของคุณถูกบังคับออกจากระบบโดยผู้ดูแล'
          await signOut()
        }
      })
      .subscribe()
  }

  // Unsubscribe from all realtime channels
  function unsubscribeAll() {
    if (profileSubscription) {
      supabase.removeChannel(profileSubscription)
      profileSubscription = null
    }
    if (forceLogoutSubscription) {
      supabase.removeChannel(forceLogoutSubscription)
      forceLogoutSubscription = null
    }
  }

  // Force logout a user (admin only)
  async function forceLogoutUser(userId, reason = 'บัญชีถูกบังคับออกจากระบบ') {
    const channel = supabase.channel('force-logout')
    await channel.send({
      type: 'broadcast',
      event: 'force_logout',
      payload: { user_id: userId, reason }
    })
    supabase.removeChannel(channel)
  }

  async function initialize() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
        subscribeToProfileChanges()
        subscribeToForceLogout()
      }
    } finally {
      loading.value = false
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_, session) => {
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
        subscribeToProfileChanges()
        subscribeToForceLogout()
      } else {
        profile.value = null
        clearRoleCache()
        unsubscribeAll()
      }
    })
  }

  async function fetchProfile() {
    if (!user.value) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (error) throw error
      
      profile.value = data
      // Update role cache when profile is fetched
      if (data?.role) {
        updateRoleCache(data.role)
      }
    } catch (error) {
      handleSupabaseError(error, 'fetchProfile', false)
    }
  }

  // Force refresh role from database
  async function refreshRole() {
    clearRoleCache()
    await fetchProfile()
    return getCachedRole()
  }

  async function signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error, 'signUp', true)
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error, 'signIn', true)
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      profile.value = null
    } catch (error) {
      handleSupabaseError(error, 'signOut', false)
    }
  }

  async function updateProfile(updates) {
    if (!user.value) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single()
      
      if (error) throw error
      profile.value = data
      return data
    } catch (error) {
      handleSupabaseError(error, 'updateProfile', true)
    }
  }

  return {
    user,
    profile,
    loading,
    forceLogoutReason,
    isLoggedIn,
    isAdmin,
    isManager,
    isStaff,
    userRole,
    initialize,
    fetchProfile,
    refreshRole,
    clearRoleCache,
    forceLogoutUser,
    unsubscribeAll,
    signUp,
    signIn,
    signOut,
    updateProfile
  }
})
