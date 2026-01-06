/* Path: /customer/order/:id */
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrdersStore } from "../stores/orders";
import { useCartStore } from "../stores/cart";
import { useProductsStore } from "../stores/products";
import { useHaptic } from "../composables/useHaptic";
import { useOrderTracking } from "../composables/useOrderTracking";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  Banknote,
  Phone,
  RefreshCw,
  ShoppingCart,
  RotateCcw,
  AlertCircle,
  Copy,
  User,
} from "lucide-vue-next";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import CancelOrderModal from "../components/CancelOrderModal.vue";
import OrderTracking from "../components/OrderTracking.vue";

const route = useRoute();
const router = useRouter();
const ordersStore = useOrdersStore();
const cartStore = useCartStore();
const productsStore = useProductsStore();
const haptic = useHaptic();
const { copyTrackingId, formatTrackingId } = useOrderTracking();

const order = ref(null);
const loading = ref(true);
const error = ref("");
const cancelling = ref(false);
const showCancelModal = ref(false);
const reordering = ref(false);
const reorderResult = ref(null); // { success: number, failed: number, unavailable: [] }
const copied = ref(false);

// Copy tracking ID
const handleCopyTracking = async () => {
  if (order.value?.tracking_id) {
    const success = await copyTrackingId(order.value.tracking_id);
    if (success) {
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    }
  }
};

// Realtime subscription for this specific order
let orderSubscription = null;

const statusConfig = {
  pending: {
    label: "รอยืนยัน",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    step: 1,
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    icon: CheckCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
    step: 2,
  },
  preparing: {
    label: "กำลังเตรียม",
    icon: Package,
    color: "text-orange-500",
    bg: "bg-orange-50",
    step: 3,
  },
  delivering: {
    label: "กำลังจัดส่ง",
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-50",
    step: 4,
  },
  completed: {
    label: "สำเร็จ",
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
    step: 5,
  },
  cancelled: {
    label: "ยกเลิก",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    step: 0,
  },
};

const trackingSteps = [
  { status: "pending", label: "รอยืนยัน" },
  { status: "confirmed", label: "ยืนยันแล้ว" },
  { status: "preparing", label: "กำลังเตรียม" },
  { status: "delivering", label: "กำลังจัดส่ง" },
  { status: "completed", label: "จัดส่งสำเร็จ" },
];

const currentStep = computed(() => {
  if (!order.value) return 0;
  return statusConfig[order.value.status]?.step || 0;
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fetchOrder = async () => {
  loading.value = true;
  error.value = "";
  try {
    const data = await ordersStore.getOrder(route.params.id);
    order.value = data;
  } catch (e) {
    error.value = "ไม่พบคำสั่งซื้อนี้";
  } finally {
    loading.value = false;
  }
};

const initRealtimeTracking = () => {
  orderSubscription = supabase
    .channel(`order-${route.params.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${route.params.id}`,
      },
      (payload) => {
        if (order.value) {
          order.value = { ...order.value, ...payload.new };
        }
      }
    )
    .subscribe();
};

const openCancelModal = () => {
  showCancelModal.value = true;
};

const handleCancelOrder = async (reason) => {
  cancelling.value = true;
  try {
    await ordersStore.cancelOrder(order.value.id, reason);
    order.value.status = "cancelled";
    order.value.cancel_reason = reason;
    showCancelModal.value = false;
  } catch (e) {
    alert(e.message);
  } finally {
    cancelling.value = false;
  }
};

// Reorder all items from this order
const reorderAll = async () => {
  if (!order.value?.order_items?.length) return;

  haptic.medium();
  reordering.value = true;
  reorderResult.value = null;

  try {
    // Fetch current product info to check availability
    const productIds = order.value.order_items.map((item) => item.product_id);
    const { data: currentProducts } = await supabase
      .from("products")
      .select("id, name, price, image, is_active, stock")
      .in("id", productIds);

    const productMap = new Map(currentProducts?.map((p) => [p.id, p]) || []);

    let successCount = 0;
    let failedCount = 0;
    const unavailableItems = [];

    for (const item of order.value.order_items) {
      const currentProduct = productMap.get(item.product_id);

      if (!currentProduct || !currentProduct.is_active) {
        // Product no longer available
        unavailableItems.push({
          name: item.product_name,
          reason: "สินค้าไม่มีจำหน่ายแล้ว",
        });
        failedCount++;
        continue;
      }

      if (
        currentProduct.stock !== null &&
        currentProduct.stock < item.quantity
      ) {
        // Not enough stock
        if (currentProduct.stock > 0) {
          // Add available quantity
          for (let i = 0; i < currentProduct.stock; i++) {
            cartStore.addToCart({
              id: currentProduct.id,
              name: currentProduct.name,
              price: currentProduct.price,
              image: currentProduct.image,
            });
          }
          unavailableItems.push({
            name: item.product_name,
            reason: `มีสินค้าเหลือ ${currentProduct.stock} ชิ้น (ต้องการ ${item.quantity})`,
          });
          successCount += currentProduct.stock;
          failedCount += item.quantity - currentProduct.stock;
        } else {
          unavailableItems.push({
            name: item.product_name,
            reason: "สินค้าหมด",
          });
          failedCount += item.quantity;
        }
        continue;
      }

      // Add to cart with original quantity
      for (let i = 0; i < item.quantity; i++) {
        cartStore.addToCart({
          id: currentProduct.id,
          name: currentProduct.name,
          price: currentProduct.price,
          image: currentProduct.image,
        });
      }
      successCount += item.quantity;
    }

    reorderResult.value = {
      success: successCount,
      failed: failedCount,
      unavailable: unavailableItems,
    };

    // If all items added successfully, go to cart
    if (failedCount === 0) {
      setTimeout(() => {
        router.push("/customer/cart");
      }, 1000);
    }
  } catch (e) {
    console.error("Reorder error:", e);
    alert("เกิดข้อผิดพลาดในการสั่งซ้ำ");
  } finally {
    reordering.value = false;
  }
};

// Close reorder result and go to cart
const goToCart = () => {
  reorderResult.value = null;
  router.push("/customer/cart");
};

onMounted(async () => {
  await fetchOrder();
  initRealtimeTracking();
});

onUnmounted(() => {
  if (orderSubscription) {
    supabase.removeChannel(orderSubscription);
  }
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen pb-6">
    <!-- Header -->
    <div
      class="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10"
    >
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">รายละเอียดคำสั่งซื้อ</h1>
      <button @click="fetchOrder" class="ml-auto p-2 -mr-2">
        <RefreshCw
          class="w-5 h-5 text-gray-500"
          :class="{ 'animate-spin': loading }"
        />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !order" class="flex justify-center py-16">
      <LoadingSpinner />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="px-4 py-16 text-center">
      <XCircle class="w-16 h-16 text-red-300 mx-auto mb-4" />
      <p class="text-gray-600">{{ error }}</p>
      <button
        @click="router.push('/customer/orders')"
        class="mt-4 text-[#007f3e] font-medium"
      >
        กลับไปหน้าประวัติ
      </button>
    </div>

    <!-- Order Detail -->
    <template v-else-if="order">
      <div class="px-4 py-4 space-y-4">
        <!-- Order Status Card -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <!-- Tracking ID -->
          <div
            v-if="order.tracking_id"
            class="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between"
          >
            <div>
              <p class="text-xs text-gray-500">หมายเลขติดตาม</p>
              <p class="font-mono font-bold text-gray-800">
                {{ formatTrackingId(order.tracking_id) }}
              </p>
            </div>
            <button
              @click="handleCopyTracking"
              class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              :class="copied ? 'text-green-600' : 'text-gray-500'"
            >
              <Copy class="w-5 h-5" />
            </button>
          </div>

          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm text-gray-500">คำสั่งซื้อ #{{ order.id }}</p>
              <p class="text-xs text-gray-400">
                {{ formatDate(order.created_at) }}
              </p>
            </div>
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              :class="[
                statusConfig[order.status].color,
                statusConfig[order.status].bg,
              ]"
            >
              <component
                :is="statusConfig[order.status].icon"
                class="w-4 h-4"
              />
              <span class="text-sm font-medium">{{
                statusConfig[order.status].label
              }}</span>
            </div>
          </div>

          <!-- Driver Info (when delivering) -->
          <div
            v-if="order.driver_name && order.status === 'delivering'"
            class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p class="text-xs text-blue-600 mb-2">ข้อมูลผู้จัดส่ง</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"
                >
                  <User class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-800">
                    {{ order.driver_name }}
                  </p>
                  <p v-if="order.driver_phone" class="text-sm text-gray-500">
                    {{ order.driver_phone }}
                  </p>
                </div>
              </div>
              <a
                v-if="order.driver_phone"
                :href="`tel:${order.driver_phone}`"
                class="p-2 bg-blue-600 text-white rounded-full"
              >
                <Phone class="w-5 h-5" />
              </a>
            </div>
          </div>

          <!-- Order Tracking Timeline -->
          <div v-if="order.status !== 'cancelled'" class="mt-6">
            <p class="text-sm font-medium text-gray-700 mb-4">ติดตามสถานะ</p>
            <div class="relative">
              <!-- Progress Line -->
              <div
                class="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200"
              ></div>
              <div
                class="absolute left-[11px] top-3 w-0.5 bg-[#007f3e] transition-all duration-500"
                :style="{ height: `${Math.max(0, (currentStep - 1) * 25)}%` }"
              ></div>

              <!-- Steps -->
              <div class="space-y-4">
                <div
                  v-for="(step, index) in trackingSteps"
                  :key="step.status"
                  class="flex items-center gap-3"
                >
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors"
                    :class="
                      index + 1 <= currentStep
                        ? 'bg-[#007f3e] text-white'
                        : 'bg-gray-200 text-gray-400'
                    "
                  >
                    <CheckCircle
                      v-if="index + 1 < currentStep"
                      class="w-4 h-4"
                    />
                    <span v-else class="text-xs font-bold">{{
                      index + 1
                    }}</span>
                  </div>
                  <span
                    class="text-sm"
                    :class="
                      index + 1 <= currentStep
                        ? 'text-gray-800 font-medium'
                        : 'text-gray-400'
                    "
                  >
                    {{ step.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cancelled Message -->
          <div v-else class="mt-4 p-3 bg-red-50 rounded-lg">
            <p class="text-red-600 text-sm font-medium">
              คำสั่งซื้อนี้ถูกยกเลิก
            </p>
            <p v-if="order.cancel_reason" class="text-red-500 text-xs mt-1">
              เหตุผล: {{ order.cancel_reason }}
            </p>
          </div>
        </div>

        <!-- Delivery Address -->
        <div v-if="order.addresses" class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <MapPin class="w-5 h-5 text-[#007f3e]" />
            <h3 class="font-bold">ที่อยู่จัดส่ง</h3>
          </div>
          <div class="text-sm text-gray-600">
            <p class="font-medium text-gray-800">{{ order.addresses.label }}</p>
            <p>{{ order.addresses.address_line }}</p>
            <p
              v-if="order.addresses.phone"
              class="flex items-center gap-1 mt-1"
            >
              <Phone class="w-4 h-4" />
              {{ order.addresses.phone }}
            </p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-bold mb-3">รายการสินค้า</h3>
          <div class="space-y-3">
            <div
              v-for="item in order.order_items"
              :key="item.id"
              class="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <p class="text-sm font-medium">{{ item.product_name }}</p>
                <p class="text-xs text-gray-500">
                  ฿{{ item.product_price }} x {{ item.quantity }}
                </p>
              </div>
              <p class="font-medium">฿{{ item.subtotal.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-bold mb-3">สรุปการชำระเงิน</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">ราคาสินค้า</span>
              <span>฿{{ order.subtotal?.toFixed(2) }}</span>
            </div>
            <div
              v-if="order.discount > 0"
              class="flex justify-between text-green-600"
            >
              <span>ส่วนลดคูปอง</span>
              <span>-฿{{ order.discount?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ค่าจัดส่ง</span>
              <span :class="order.delivery_fee === 0 ? 'text-[#007f3e]' : ''">
                {{
                  order.delivery_fee === 0 ? "ฟรี" : `฿${order.delivery_fee}`
                }}
              </span>
            </div>
            <div class="border-t pt-2 flex justify-between font-bold">
              <span>รวมทั้งหมด</span>
              <span class="text-[#007f3e] text-lg"
                >฿{{ order.total?.toFixed(2) }}</span
              >
            </div>
          </div>

          <!-- Payment Method -->
          <div
            class="mt-4 pt-3 border-t flex items-center gap-2 text-sm text-gray-600"
          >
            <component
              :is="order.payment_method === 'cash' ? Banknote : CreditCard"
              class="w-4 h-4"
            />
            <span>{{
              order.payment_method === "cash" ? "เงินสด" : "บัตรเครดิต/เดบิต"
            }}</span>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="order.notes" class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-bold mb-2">หมายเหตุ</h3>
          <p class="text-sm text-gray-600">{{ order.notes }}</p>
        </div>

        <!-- Reorder Button (for completed/delivered orders) -->
        <button
          v-if="['completed', 'delivered'].includes(order.status)"
          @click="reorderAll"
          :disabled="reordering"
          class="w-full bg-[#007f3e] text-white py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors flex items-center justify-center gap-2 touch-feedback disabled:opacity-50"
        >
          <RotateCcw v-if="!reordering" class="w-5 h-5" />
          <LoadingSpinner v-else class="w-5 h-5" />
          <span>{{
            reordering ? "กำลังเพิ่มสินค้า..." : "สั่งซ้ำทั้งออเดอร์"
          }}</span>
        </button>

        <!-- Cancel Button (only for pending orders) -->
        <button
          v-if="order.status === 'pending'"
          @click="openCancelModal"
          class="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
        >
          ยกเลิกคำสั่งซื้อ
        </button>
      </div>

      <!-- Reorder Result Modal -->
      <Transition name="fade">
        <div
          v-if="reorderResult"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="reorderResult = null"
        >
          <div
            class="bg-white rounded-2xl w-full max-w-sm p-5 animate-scale-in"
          >
            <!-- Success Header -->
            <div class="text-center mb-4">
              <div
                class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                :class="
                  reorderResult.failed === 0 ? 'bg-green-100' : 'bg-yellow-100'
                "
              >
                <CheckCircle
                  v-if="reorderResult.failed === 0"
                  class="w-8 h-8 text-green-600"
                />
                <AlertCircle v-else class="w-8 h-8 text-yellow-600" />
              </div>
              <h3 class="text-lg font-bold text-gray-800">
                {{
                  reorderResult.failed === 0
                    ? "เพิ่มสินค้าสำเร็จ!"
                    : "เพิ่มสินค้าบางส่วน"
                }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                เพิ่ม {{ reorderResult.success }} รายการลงตะกร้าแล้ว
              </p>
            </div>

            <!-- Unavailable Items -->
            <div v-if="reorderResult.unavailable.length > 0" class="mb-4">
              <p class="text-sm font-medium text-gray-700 mb-2">
                สินค้าที่ไม่สามารถเพิ่มได้:
              </p>
              <div
                class="bg-red-50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto"
              >
                <div
                  v-for="(item, index) in reorderResult.unavailable"
                  :key="index"
                  class="text-sm"
                >
                  <p class="font-medium text-red-700">{{ item.name }}</p>
                  <p class="text-red-500 text-xs">{{ item.reason }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="reorderResult = null"
                class="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                ปิด
              </button>
              <button
                @click="goToCart"
                class="flex-1 py-2.5 bg-[#007f3e] text-white rounded-xl font-medium hover:bg-[#006633] transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart class="w-4 h-4" />
                ไปตะกร้า
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </template>

    <!-- Cancel Order Modal -->
    <CancelOrderModal
      :show="showCancelModal"
      :order-id="order?.id"
      :loading="cancelling"
      @close="showCancelModal = false"
      @confirm="handleCancelOrder"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
