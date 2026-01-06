import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration
 * Singleton instance for database operations
 */

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error('Invalid VITE_SUPABASE_URL format. Must be a valid URL.')
}

/**
 * Supabase client instance
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// HMR support - clean up realtime connections on hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    // Remove all channels to prevent duplicate subscriptions
    const channels = supabase.getChannels()
    for (const channel of channels) {
      await supabase.removeChannel(channel)
    }
    console.log('[HMR] Supabase realtime channels cleaned up')
  })
}
