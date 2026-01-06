// Supabase Edge Function: Process Scheduled Flash Sales
// Runs every minute via cron to:
// 1. Activate scheduled flash sales that should start
// 2. Deactivate flash sales that have ended
// 3. Send push notifications before flash sales start

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledFlashSale {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  product_ids: number[];
  notify_before: number;
  is_active: boolean;
  notification_sent: boolean;
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      activated: [] as string[],
      deactivated: [] as string[],
      notifications_sent: 0,
      errors: [] as string[],
    };

    // 1. Find and activate scheduled flash sales that should start now
    const { data: salesToActivate, error: activateError } = await supabase
      .from("scheduled_flash_sales")
      .select("*")
      .eq("is_active", true)
      .lte("start_time", now.toISOString())
      .gt("end_time", now.toISOString());

    if (activateError) {
      results.errors.push(`Activate query error: ${activateError.message}`);
    } else if (salesToActivate && salesToActivate.length > 0) {
      for (const sale of salesToActivate as ScheduledFlashSale[]) {
        // Activate products for this sale
        if (sale.product_ids && sale.product_ids.length > 0) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              is_flash_sale: true,
              flash_sale_order: 1,
              updated_at: now.toISOString(),
            })
            .in("id", sale.product_ids);

          if (updateError) {
            results.errors.push(`Activate products error for ${sale.name}: ${updateError.message}`);
          } else {
            results.activated.push(sale.name);
          }
        }
      }
    }

    // 2. Find and deactivate flash sales that have ended
    const { data: salesToDeactivate, error: deactivateError } = await supabase
      .from("scheduled_flash_sales")
      .select("*")
      .eq("is_active", true)
      .lte("end_time", now.toISOString());

    if (deactivateError) {
      results.errors.push(`Deactivate query error: ${deactivateError.message}`);
    } else if (salesToDeactivate && salesToDeactivate.length > 0) {
      for (const sale of salesToDeactivate as ScheduledFlashSale[]) {
        // Deactivate products
        if (sale.product_ids && sale.product_ids.length > 0) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              is_flash_sale: false,
              flash_sale_order: null,
              updated_at: now.toISOString(),
            })
            .in("id", sale.product_ids);

          if (updateError) {
            results.errors.push(`Deactivate products error for ${sale.name}: ${updateError.message}`);
          }
        }

        // Mark sale as inactive
        await supabase
          .from("scheduled_flash_sales")
          .update({ is_active: false })
          .eq("id", sale.id);

        results.deactivated.push(sale.name);
      }
    }

    // 3. Send notifications for upcoming flash sales
    const { data: salesToNotify, error: notifyError } = await supabase
      .from("scheduled_flash_sales")
      .select("*")
      .eq("is_active", true)
      .eq("notification_sent", false)
      .gt("start_time", now.toISOString());

    if (notifyError) {
      results.errors.push(`Notify query error: ${notifyError.message}`);
    } else if (salesToNotify && salesToNotify.length > 0) {
      for (const sale of salesToNotify as ScheduledFlashSale[]) {
        const startTime = new Date(sale.start_time);
        const notifyTime = new Date(startTime.getTime() - sale.notify_before * 60 * 1000);

        // Check if it's time to send notification
        if (now >= notifyTime && now < startTime) {
          // Get all push subscriptions
          const { data: subscriptions } = await supabase
            .from("push_subscriptions")
            .select("*");

          if (subscriptions && subscriptions.length > 0) {
            const notificationsSent = await sendPushNotifications(
              subscriptions as PushSubscription[],
              sale,
              startTime
            );
            results.notifications_sent += notificationsSent;
          }

          // Mark notification as sent
          await supabase
            .from("scheduled_flash_sales")
            .update({ notification_sent: true })
            .eq("id", sale.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Send push notifications to all subscribers
async function sendPushNotifications(
  subscriptions: PushSubscription[],
  sale: ScheduledFlashSale,
  startTime: Date
): Promise<number> {
  let sent = 0;
  const timeUntilStart = Math.round((startTime.getTime() - Date.now()) / 60000);
  
  const payload = JSON.stringify({
    title: "⚡ Flash Sale กำลังจะเริ่ม!",
    body: `${sale.name} เริ่มใน ${timeUntilStart} นาที! อย่าพลาด`,
    icon: "/icons/flash-sale.png",
    badge: "/icons/badge.png",
    tag: `flash-sale-${sale.id}`,
    data: {
      type: "flash_sale",
      sale_id: sale.id,
      url: "/customer/promotions",
    },
    actions: [
      { action: "view", title: "ดูสินค้า" },
      { action: "dismiss", title: "ปิด" },
    ],
  });

  // Get VAPID keys from environment
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID keys not configured");
    return 0;
  }

  for (const sub of subscriptions) {
    try {
      // In production, use web-push library or similar
      // This is a simplified version
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTL": "86400",
        },
        body: payload,
      });

      if (response.ok) {
        sent++;
      }
    } catch (error) {
      console.error(`Failed to send notification to ${sub.user_id}:`, error);
    }
  }

  return sent;
}
