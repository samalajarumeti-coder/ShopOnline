// Supabase Edge Function: expire-points
// Run daily via cron job to expire old points

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call expire_old_points function
    const { error } = await supabase.rpc('expire_old_points')
    
    if (error) {
      console.error('Error expiring points:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Points expired successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Points expired successfully',
        timestamp: new Date().toISOString()
      }), 
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
