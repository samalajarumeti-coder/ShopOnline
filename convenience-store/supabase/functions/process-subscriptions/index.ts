// Supabase Edge Function: Process Subscriptions Daily
// ทำงานทุกวันเพื่อ process subscriptions ที่ถึงกำหนดจัดส่ง
// รองรับระบบส่วนลด Subscription และ Tier System

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Subscription {
  id: string
  user_id: string
  name: string
  frequency: string
  next_delivery_date: string
  address_id: string
  payment_method: string
  auto_confirm: boolean
  is_active: boolean
  discount_enabled: boolean
  discount_percent: number
}

interface DiscountResult {
  discount_percent: number
  discount_amount: number
  final_total: number
  discount_breakdown: {
    base_discount: number
    tier_bonus: number
    loyalty_bonus: number
    tier_name: string
  }
}

interface ProcessResult {
  subscription_id: string
  status: 'success' | 'failed' | 'skipped'
  order_id?: string
  discount_applied?: number
  error?: string
}

// Calculate subscription discount with tier system
async function calculateDiscount(
  supabase: any,
  subscriptionId: string,
  userId: string,
  subtotal: number
): Promise<DiscountResult> {
  // Get subscription details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('discount_enabled, discount_percent, created_at')
    .eq('id', subscriptionId)
    .single()

  // Get discount settings
  const { data: settings } = await supabase
    .from('subscription_discount_settings')
    .select('*')
    .single()

  // Get user's subscription tier
  const { data: userTier } = await supabase
    .from('subscription_tiers_users')
    .select('*, subscription_tiers(*)')
    .eq('user_id', userId)
    .single()

  // Default values
  const defaultSettings = {
    default_discount_percent: 5,
    max_discount_percent: 15,
    loyalty_bonus_enabled: true,
    loyalty_bonus_percent: 2
  }

  const s = settings || defaultSettings

  // Check if discount is enabled
  if (!subscription?.discount_enabled) {
    return {
      discount_percent: 0,
      discount_amount: 0,
      final_total: subtotal,
      discount_breakdown: {
        base_discount: 0,
        tier_bonus: 0,
        loyalty_bonus: 0,
        tier_name: 'None'
      }
    }
  }

  // Calculate base discount
  let baseDiscount = subscription.discount_percent || s.default_discount_percent

  // Calculate tier bonus
  let tierBonus = 0
  let tierName = 'Bronze'
  if (userTier?.subscription_tiers) {
    tierBonus = userTier.subscription_tiers.discount_bonus || 0
    tierName = userTier.subscription_tiers.name || 'Bronze'
  }

  // Calculate loyalty bonus (based on months subscribed)
  let loyaltyBonus = 0
  if (s.loyalty_bonus_enabled && subscription.created_at) {
    const monthsSubscribed = Math.floor(
      (Date.now() - new Date(subscription.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
    )
    loyaltyBonus = Math.min(monthsSubscribed, 3) * s.loyalty_bonus_percent
  }

  // Calculate total discount (capped at max)
  const totalDiscount = Math.min(
    baseDiscount + tierBonus + loyaltyBonus,
    s.max_discount_percent
  )

  const discountAmount = Math.round(subtotal * totalDiscount / 100 * 100) / 100
  const finalTotal = subtotal - discountAmount

  return {
    discount_percent: totalDiscount,
    discount_amount: discountAmount,
    final_total: finalTotal,
    discount_breakdown: {
      base_discount: baseDiscount,
      tier_bonus: tierBonus,
      loyalty_bonus: loyaltyBonus,
      tier_name: tierName
    }
  }
}

// Update user's subscription tier based on total spending
async function updateUserTier(supabase: any, userId: string) {
  // Get user's total subscription spending
  const { data: orders } = await supabase
    .from('subscription_orders')
    .select(`
      orders (total),
      subscriptions!inner (user_id)
    `)
    .eq('subscriptions.user_id', userId)
    .eq('status', 'created')

  const totalSpending = orders?.reduce((sum: number, o: any) => 
    sum + (o.orders?.total || 0), 0) || 0

  // Get appropriate tier
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .lte('min_spending', totalSpending)
    .order('min_spending', { ascending: false })
    .limit(1)

  if (tiers?.length > 0) {
    // Upsert user tier
    await supabase
      .from('subscription_tiers_users')
      .upsert({
        user_id: userId,
        tier_id: tiers[0].id,
        total_spending: totalSpending,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]
    const results: ProcessResult[] = []

    // Get all active subscriptions due today
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_items (
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            is_active,
            stock
          )
        ),
        addresses (
          id,
          label,
          address_line
        )
      `)
      .eq('is_active', true)
      .lte('next_delivery_date', today)

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`)
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to process`)

    for (const subscription of subscriptions || []) {
      try {
        if (!subscription.subscription_items?.length) {
          results.push({
            subscription_id: subscription.id,
            status: 'skipped',
            error: 'No items in subscription'
          })
          continue
        }

        if (!subscription.address_id || !subscription.addresses) {
          results.push({
            subscription_id: subscription.id,
            status: 'failed',
            error: 'No delivery address'
          })
          
          await supabase.from('subscription_orders').insert({
            subscription_id: subscription.id,
            scheduled_date: subscription.next_delivery_date,
            status: 'failed',
            error_message: 'No delivery address configured'
          })
          continue
        }

        // Calculate order totals
        let subtotal = 0
        const validItems: any[] = []

        for (const item of subscription.subscription_items) {
          const product = item.products
          
          if (!product || !product.is_active) continue
          if (product.stock !== null && product.stock < item.quantity) continue

          validItems.push({
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            quantity: item.quantity,
            subtotal: product.price * item.quantity
          })

          subtotal += product.price * item.quantity
        }

        if (validItems.length === 0) {
          results.push({
            subscription_id: subscription.id,
            status: 'failed',
            error: 'No valid items available'
          })
          
          await supabase.from('subscription_orders').insert({
            subscription_id: subscription.id,
            scheduled_date: subscription.next_delivery_date,
            status: 'failed',
            error_message: 'No valid items available'
          })
          continue
        }

        // Calculate subscription discount
        const discountResult = await calculateDiscount(
          supabase,
          subscription.id,
          subscription.user_id,
          subtotal
        )

        // Calculate delivery fee
        const deliveryFee = discountResult.final_total >= 200 ? 0 : 30
        const total = discountResult.final_total + deliveryFee

        // Create order with discount
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: subscription.user_id,
            address_id: subscription.address_id,
            subtotal,
            delivery_fee: deliveryFee,
            discount: discountResult.discount_amount,
            total,
            payment_method: subscription.payment_method,
            notes: `สั่งซื้ออัตโนมัติจาก: ${subscription.name} (ส่วนลด ${discountResult.discount_percent}% - ${discountResult.discount_breakdown.tier_name})`,
            status: subscription.auto_confirm ? 'confirmed' : 'pending'
          })
          .select()
          .single()

        if (orderError) {
          throw new Error(`Failed to create order: ${orderError.message}`)
        }

        // Create order items
        const orderItems = validItems.map(item => ({
          ...item,
          order_id: order.id
        }))

        await supabase.from('order_items').insert(orderItems)

        // Record subscription order with discount info
        await supabase.from('subscription_orders').insert({
          subscription_id: subscription.id,
          order_id: order.id,
          scheduled_date: subscription.next_delivery_date,
          status: 'created',
          discount_amount: discountResult.discount_amount,
          original_total: subtotal + deliveryFee,
          final_total: total
        })

        // Calculate next delivery date
        let nextDate = new Date(subscription.next_delivery_date)
        switch (subscription.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
          default:
            nextDate.setDate(nextDate.getDate() + 7)
        }

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            next_delivery_date: nextDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        // Update user's tier
        await updateUserTier(supabase, subscription.user_id)

        // Create notification
        await supabase.from('notifications').insert({
          user_id: subscription.user_id,
          title: 'สั่งซื้ออัตโนมัติสำเร็จ',
          message: `คำสั่งซื้อจาก "${subscription.name}" ยอด ฿${total} (ประหยัด ฿${discountResult.discount_amount})`,
          type: 'subscription',
          data: { 
            order_id: order.id, 
            subscription_id: subscription.id,
            discount: discountResult
          }
        }).catch(() => {})

        results.push({
          subscription_id: subscription.id,
          status: 'success',
          order_id: order.id,
          discount_applied: discountResult.discount_amount
        })

        console.log(`Processed subscription ${subscription.id}, order ${order.id}, discount ฿${discountResult.discount_amount}`)

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        
        results.push({
          subscription_id: subscription.id,
          status: 'failed',
          error: error.message
        })

        await supabase.from('subscription_orders').insert({
          subscription_id: subscription.id,
          scheduled_date: subscription.next_delivery_date,
          status: 'failed',
          error_message: error.message
        }).catch(() => {})
      }
    }

    const summary = {
      processed: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      total_discount: results.reduce((sum, r) => sum + (r.discount_applied || 0), 0),
      results
    }

    console.log('Processing complete:', summary)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in process-subscriptions:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
