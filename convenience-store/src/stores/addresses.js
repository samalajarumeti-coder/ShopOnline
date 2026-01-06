import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/errorHandler'
import { useAuthStore } from './auth'

export const useAddressesStore = defineStore('addresses', () => {
  const addresses = ref([])
  const loading = ref(false)

  async function fetchAddresses() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('is_default', { ascending: false })
      
      if (error) throw error
      addresses.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function addAddress(address) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('กรุณาเข้าสู่ระบบ')

    // If this is the first address or marked as default, update others
    if (address.is_default || addresses.value.length === 0) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', authStore.user.id)
      address.is_default = true
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: authStore.user.id })
      .select()
      .single()

    if (error) throw error
    addresses.value.unshift(data)
    return data
  }

  async function updateAddress(id, updates) {
    const authStore = useAuthStore()
    
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', authStore.user.id)
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    const index = addresses.value.findIndex(a => a.id === id)
    if (index > -1) addresses.value[index] = data
    
    return data
  }

  async function deleteAddress(id) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    if (error) throw error
    addresses.value = addresses.value.filter(a => a.id !== id)
  }

  function getDefaultAddress() {
    return addresses.value.find(a => a.is_default) || addresses.value[0]
  }

  return {
    addresses,
    loading,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress
  }
})
