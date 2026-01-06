// Supabase Edge Function: update-leaderboard
// Run periodically to update leaderboard rankings

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get period from query params (default: monthly)
    const url = new URL(req.url)
    const period = url.searchParams.get('period') || 'monthly'

    // Calculate period dates
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date

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
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
    }

    // Update leaderboard
    const { error: updateError } = await supabase.rpc('update_leaderboard', {
      p_period: period,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString()
    })
    
    if (updateError) {
      console.error('Error updating leaderboard:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: updateError.message 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Leaderboard updated successfully for period: ${period}`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Leaderboard updated for ${period}`,
        period,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
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
