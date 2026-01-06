import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { supabase } from '@/lib/supabase'

// Global registry to track subscriptions for HMR cleanup
const subscriptionRegistry = new Map()

/**
 * Composable for managing Supabase realtime subscriptions with HMR support
 * Automatically cleans up subscriptions on component unmount and HMR updates
 */
export function useRealtimeSubscription() {
  const isConnected = ref(false)
  const error = ref(null)
  const channels = ref([])
  
  const instance = getCurrentInstance()
  const componentId = instance?.uid || Math.random().toString(36).slice(2)

  /**
   * Subscribe to a Supabase channel with automatic cleanup
   */
  const subscribe = (channelName, config = {}) => {
    const { table, event = '*', filter, schema = 'public', onInsert, onUpdate, onDelete, onChange } = config
    
    // Clean up existing subscription with same name
    unsubscribe(channelName)
    
    try {
      let channel = supabase.channel(channelName)
      
      if (table) {
        const postgresConfig = { event, schema, table }
        if (filter) postgresConfig.filter = filter
        
        channel = channel.on('postgres_changes', postgresConfig, (payload) => {
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new, payload)
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new, payload.old, payload)
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old, payload)
          }
          if (onChange) onChange(payload)
        })
      }
      
      channel.subscribe((status) => {
        isConnected.value = status === 'SUBSCRIBED'
        if (status === 'CHANNEL_ERROR') {
          error.value = new Error(`Channel ${channelName} error`)
        }
      })
      
      channels.value.push({ name: channelName, channel })
      
      // Register for HMR cleanup
      if (!subscriptionRegistry.has(componentId)) {
        subscriptionRegistry.set(componentId, [])
      }
      subscriptionRegistry.get(componentId).push(channel)
      
      return channel
    } catch (err) {
      error.value = err
      console.error(`[Realtime] Failed to subscribe to ${channelName}:`, err)
      return null
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  const unsubscribe = (channelName) => {
    const index = channels.value.findIndex(c => c.name === channelName)
    if (index !== -1) {
      const { channel } = channels.value[index]
      supabase.removeChannel(channel)
      channels.value.splice(index, 1)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  const unsubscribeAll = () => {
    channels.value.forEach(({ channel }) => {
      supabase.removeChannel(channel)
    })
    channels.value = []
    isConnected.value = false
    subscriptionRegistry.delete(componentId)
  }

  // Auto cleanup on component unmount
  onUnmounted(() => {
    unsubscribeAll()
  })

  return {
    isConnected,
    error,
    channels,
    subscribe,
    unsubscribe,
    unsubscribeAll
  }
}

// HMR cleanup handler
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up all subscriptions when module is replaced
    subscriptionRegistry.forEach((channels) => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (e) {
          // Ignore cleanup errors
        }
      })
    })
    subscriptionRegistry.clear()
    console.log('[HMR] Cleaned up Supabase realtime subscriptions')
  })
}

export default useRealtimeSubscription
