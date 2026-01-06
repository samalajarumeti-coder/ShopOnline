import { ref, computed } from "vue";
import { useAuthStore } from "../stores/auth";

const isSupported = ref(false);
const isSubscribed = ref(false);
const subscription = ref(null);
const permission = ref("default");

// Check if push notifications are supported
const checkSupport = () => {
  isSupported.value =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  
  if (isSupported.value) {
    permission.value = Notification.permission;
  }
  
  return isSupported.value;
};

export function usePushNotifications() {
  const authStore = useAuthStore();

  // Request permission
  const requestPermission = async () => {
    if (!isSupported.value) {
      throw new Error("Push notifications are not supported");
    }

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      
      if (result === "granted") {
        await subscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      throw error;
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported.value || permission.value !== "granted") {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        subscription.value = existingSubscription;
        isSubscribed.value = true;
        return existingSubscription;
      }

      // Subscribe to push notifications
      // Note: You need to generate VAPID keys for production
      // Use: npx web-push generate-vapid-keys
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
      
      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured");
        return null;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      subscription.value = newSubscription;
      isSubscribed.value = true;

      // Save subscription to backend (you'll need to implement this)
      await saveSubscriptionToBackend(newSubscription);

      return newSubscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!subscription.value) return;

    try {
      await subscription.value.unsubscribe();
      
      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscription.value);
      
      subscription.value = null;
      isSubscribed.value = false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  };

  // Save subscription to backend (Supabase)
  const saveSubscriptionToBackend = async (sub) => {
    if (!authStore.isLoggedIn) return;

    try {
      // Store subscription in localStorage for now
      // In production, save to Supabase database
      const subscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
          auth: arrayBufferToBase64(sub.getKey("auth")),
        },
        userId: authStore.user.id,
      };

      localStorage.setItem(
        "push_subscription",
        JSON.stringify(subscriptionData)
      );

      // TODO: Save to Supabase
      // await supabase.from('push_subscriptions').upsert({
      //   user_id: authStore.user.id,
      //   subscription: subscriptionData
      // })
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  // Remove subscription from backend
  const removeSubscriptionFromBackend = async (sub) => {
    try {
      localStorage.removeItem("push_subscription");
      
      // TODO: Remove from Supabase
      // await supabase.from('push_subscriptions')
      //   .delete()
      //   .eq('user_id', authStore.user.id)
    } catch (error) {
      console.error("Error removing subscription:", error);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (permission.value !== "granted") {
      throw new Error("Notification permission not granted");
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("ทดสอบการแจ้งเตือน", {
      body: "นี่คือการแจ้งเตือนทดสอบจากระบบ",
      icon: "/vite.svg",
      badge: "/vite.svg",
      tag: "test-notification",
      data: { url: "/" },
    });
  };

  // Initialize
  checkSupport();

  return {
    isSupported: computed(() => isSupported.value),
    isSubscribed: computed(() => isSubscribed.value),
    permission: computed(() => permission.value),
    subscription: computed(() => subscription.value),
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
