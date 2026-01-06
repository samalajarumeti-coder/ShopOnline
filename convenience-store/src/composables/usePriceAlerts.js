import { ref, computed } from "vue";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth";

const alerts = ref([]);
const loading = ref(false);

export function usePriceAlerts() {
  const authStore = useAuthStore();

  // Fetch all alerts for current user
  const fetchAlerts = async () => {
    if (!authStore.isLoggedIn) {
      alerts.value = [];
      return;
    }

    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          *,
          products (
            id,
            name,
            name_en,
            price,
            original_price,
            image,
            is_active,
            stock
          )
        `)
        .eq("user_id", authStore.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      alerts.value = data || [];
    } catch (e) {
      console.error("Failed to fetch price alerts:", e);
      alerts.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Check if product has active alert
  const hasAlert = (productId) => {
    return alerts.value.some(
      (alert) => alert.product_id === productId && alert.is_active
    );
  };

  // Get alert for specific product
  const getAlert = (productId) => {
    return alerts.value.find(
      (alert) => alert.product_id === productId && alert.is_active
    );
  };

  // Create new price alert
  const createAlert = async (productId, targetPrice, currentPrice) => {
    if (!authStore.isLoggedIn) {
      throw new Error("กรุณาเข้าสู่ระบบก่อนตั้งการแจ้งเตือน");
    }

    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .insert({
          user_id: authStore.user.id,
          product_id: productId,
          target_price: targetPrice,
          current_price: currentPrice,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === "23505") {
          throw new Error("คุณมีการแจ้งเตือนสำหรับสินค้านี้อยู่แล้ว");
        }
        throw error;
      }

      await fetchAlerts();
      return data;
    } catch (e) {
      console.error("Failed to create price alert:", e);
      throw e;
    }
  };

  // Update existing alert
  const updateAlert = async (alertId, targetPrice) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .update({ target_price: targetPrice })
        .eq("id", alertId)
        .eq("user_id", authStore.user.id);

      if (error) throw error;
      await fetchAlerts();
    } catch (e) {
      console.error("Failed to update price alert:", e);
      throw e;
    }
  };

  // Delete alert
  const deleteAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", alertId)
        .eq("user_id", authStore.user.id);

      if (error) throw error;
      await fetchAlerts();
    } catch (e) {
      console.error("Failed to delete price alert:", e);
      throw e;
    }
  };

  // Toggle alert active status
  const toggleAlert = async (alertId, isActive) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .update({ is_active: isActive })
        .eq("id", alertId)
        .eq("user_id", authStore.user.id);

      if (error) throw error;
      await fetchAlerts();
    } catch (e) {
      console.error("Failed to toggle price alert:", e);
      throw e;
    }
  };

  // Get active alerts count
  const activeAlertsCount = computed(() => {
    return alerts.value.filter((a) => a.is_active).length;
  });

  // Get triggered alerts (price met)
  const triggeredAlerts = computed(() => {
    return alerts.value.filter(
      (a) =>
        a.is_active &&
        a.products &&
        a.products.price <= a.target_price &&
        !a.notified_at
    );
  });

  return {
    alerts: computed(() => alerts.value),
    loading: computed(() => loading.value),
    activeAlertsCount,
    triggeredAlerts,
    fetchAlerts,
    hasAlert,
    getAlert,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
  };
}
