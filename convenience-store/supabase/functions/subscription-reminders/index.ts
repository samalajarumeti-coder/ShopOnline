// Supabase Edge Function: Send Subscription Reminders
// ส่งการแจ้งเตือนก่อนวันจัดส่ง 1 วัน

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderResult {
  subscription_id: string
  user_id: string
  status: 'sent' | 'failed'
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const results: ReminderResult[] = []

    // Get subscriptions due tomorrow
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        name,
        next_delivery_date,
        subscription_items (
          quantity,
          products (
            name,
            price
          )
        ),
        profiles:user_id (
          full_name,
          push_subscription
        )
      `)
      .eq('is_active', true)
      .eq('next_delivery_date', tomorrowStr)

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`)
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions due tomorrow`)

    for (const subscription of subscriptions || []) {
      try {
        // Calculate total
        const total = subscription.subscription_items?.reduce((sum: number, item: any) => {
          return sum + (item.products?.price || 0) * item.quantity
        }, 0) || 0

        const itemCount = subscription.subscription_items?.length || 0

        // Create in-app notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: subscription.user_id,
          title: '🔔 แจ้งเตือนการจัดส่งพรุ่งนี้',
          message: `รายการ "${subscription.name}" (${itemCount} สินค้า, ฿${total}) จะถูกสั่งซื้อพรุ่งนี้ คุณสามารถแก้ไขหรือข้ามได้`,
          type: 'subscription_reminder',
          data: { 
            subscription_id: subscription.id,
            total,
            item_count: itemCount
          }
        })

        if (notifError) {
          console.error(`Failed to create notification: ${notifError.message}`)
        }

        // Send push notification if user has push subscription
        const profile = subscription.profiles as any
        if (profile?.push_subscription) {
          try {
            const pushSubscription = JSON.parse(profile.push_subscription)
            
            // Send web push notification
            await sendWebPush(pushSubscription, {
              title: '🔔 แจ้งเตือนการจัดส่งพรุ่งนี้',
              body: `รายการ "${subscription.name}" จะถูกสั่งซื้อพรุ่งนี้`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              data: {
                url: `/customer/subscriptions/${subscription.id}`,
                subscription_id: subscription.id
              },
              actions: [
                { action: 'view', title: 'ดูรายละเอียด' },
                { action: 'skip', title: 'ข้ามครั้งนี้' }
              ]
            })

            console.log(`Push notification sent to user ${subscription.user_id}`)
          } catch (pushError) {
            console.error(`Failed to send push notification:`, pushError)
          }
        }

        results.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          status: 'sent'
        })

      } catch (error) {
        console.error(`Error sending reminder for subscription ${subscription.id}:`, error)
        
        results.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          status: 'failed',
          error: error.message
        })
      }
    }

    const summary = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    }

    console.log('Reminder processing complete:', summary)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in subscription-reminders:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Helper function to send web push notification
async function sendWebPush(subscription: any, payload: any) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('VAPID keys not configured, skipping push notification')
    return
  }

  // Note: In production, use a proper web-push library
  // This is a simplified example
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.status}`)
  }
}
