// Supabase Edge Function: award-leaderboard-rewards
// Run at end of period to award rewards to top performers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get period from query params
    const url = new URL(req.url)
    const period = url.searchParams.get('period') || 'monthly'

    // Calculate previous period dates
    const now = new Date()
    let periodStart: Date

    switch (period) {
      case 'weekly':
        periodStart = new Date(now)
        periodStart.setDate(now.getDate() - 7 - now.getDay())
        periodStart.setHours(0, 0, 0, 0)
        break

      case 'monthly':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
    }

    // Award rewards
    const { error: awardError } = await supabase.rpc('award_leaderboard_rewards', {
      p_period: period,
      p_period_start: periodStart.toISOString()
    })
    
    if (awardError) {
      console.error('Error awarding rewards:', awardError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: awardError.message 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Rewards awarded successfully for period: ${period}`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Rewards awarded for ${period}`,
        period,
        periodStart: periodStart.toISOString(),
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
