<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Package,
  Trash2,
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  RefreshCw,
  MapPin,
  CreditCard,
  Edit2,
  ShoppingBag,
  Percent,
  Gift,
} from "lucide-vue-next";
import { useSubscriptions } from "../composables/useSubscriptions";
import { useAuthStore } from "../stores/auth";
import LazyImage from "../components/LazyImage.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import EmptyState from "../components/EmptyState.vue";

const router = useRouter();
const authStore = useAuthStore();
const {
  subscriptions,
  loading,
  fetchSubscriptions,
  toggleSubscription,
  deleteSubscription,
  processNow,
  skipNextDelivery,
  calculateTotal,
  calculateDiscount,
  formatFrequency,
  formatNextDelivery,
} = useSubscriptions();

const processingId = ref(null);
const deletingId = ref(null);
const showDeleteConfirm = ref(null);
const discountInfo = ref({});

// Handle process now
const handleProcessNow = async (subscription) => {
  if (!confirm("ต้องการสั่งซื้อตอนนี้เลยหรือไม่?")) return;

  processingId.value = subscription.id;
  try {
    const result = await processNow(subscription.id);
    alert(`สร้างคำสั่งซื้อสำเร็จ! ยอดรวม ฿${result.total}`);
    router.push(`/customer/order/${result.order_id}`);
  } catch (e) {
    alert("เกิดข้อผิดพลาด: " + e.message);
  } finally {
    processingId.value = null;
  }
};

// Handle skip
const handleSkip = async (subscription) => {
  if (!confirm("ต้องการข้ามการจัดส่งครั้งถัดไปหรือไม่?")) return;

  try {
    await skipNextDelivery(subscription.id);
  } catch (e) {
    alert("เกิดข้อผิดพลาด: " + e.message);
  }
};

// Handle delete
const handleDelete = async (subscriptionId) => {
  deletingId.value = subscriptionId;
  try {
    await deleteSubscription(subscriptionId);
    showDeleteConfirm.value = null;
  } catch (e) {
    alert("เกิดข้อผิดพลาด: " + e.message);
  } finally {
    deletingId.value = null;
  }
};

onMounted(async () => {
  if (authStore.isLoggedIn) {
    await fetchSubscriptions();
    // Calculate discount for each subscription
    for (const sub of subscriptions.value) {
      const subtotal = calculateTotal(sub);
      if (subtotal > 0) {
        const discount = await calculateDiscount(sub.id, subtotal);
        discountInfo.value[sub.id] = discount;
      }
    }
  }
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen pb-24">
    <!-- Header -->
    <div
      class="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10"
    >
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">สั่งซื้ออัตโนมัติ</h1>
      <button @click="fetchSubscriptions" class="ml-auto p-2 -mr-2">
        <RefreshCw
          class="w-5 h-5 text-gray-500"
          :class="{ 'animate-spin': loading }"
        />
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading && subscriptions.length === 0"
      class="flex justify-center py-16"
    >
      <LoadingSpinner />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="subscriptions.length === 0"
      icon="calendar"
      title="ยังไม่มีรายการสั่งซื้ออัตโนมัติ"
      description="สร้างรายการสินค้าที่ต้องการสั่งซื้อประจำ ระบบจะสั่งให้อัตโนมัติตามกำหนด"
    >
      <router-link
        to="/customer/subscriptions/new"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#007f3e] text-white rounded-xl font-medium"
      >
        <Plus class="w-5 h-5" />
        สร้างรายการใหม่
      </router-link>
    </EmptyState>

    <!-- Subscriptions List -->
    <div v-else class="px-4 py-4 space-y-4">
      <!-- Info Banner -->
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-3">
        <div class="flex items-start gap-2">
          <Calendar class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="font-medium text-purple-800">สั่งซื้ออัตโนมัติ</p>
            <p class="text-purple-600 text-xs mt-0.5">
              ระบบจะสร้างคำสั่งซื้อให้อัตโนมัติตามกำหนดที่ตั้งไว้
            </p>
          </div>
        </div>
      </div>

      <!-- Discount Banner -->
      <div
        class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3"
      >
        <div class="flex items-start gap-2">
          <Gift class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="font-medium text-green-800">รับส่วนลด 5-15% ทุกครั้ง!</p>
            <p class="text-green-600 text-xs mt-0.5">
              สมาชิก Subscription รับส่วนลดพิเศษ + โบนัสเพิ่มตามระยะเวลาสมัคร
            </p>
          </div>
        </div>
      </div>

      <!-- Subscription Cards -->
      <div
        v-for="subscription in subscriptions"
        :key="subscription.id"
        class="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <!-- Header -->
        <div class="p-4 border-b">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-800">{{ subscription.name }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="
                    subscription.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  "
                >
                  {{ subscription.is_active ? "เปิดใช้งาน" : "หยุดชั่วคราว" }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatFrequency(subscription.frequency) }}
                </span>
              </div>
            </div>
            <button
              @click="toggleSubscription(subscription.id)"
              class="p-2 rounded-full transition-colors"
              :class="
                subscription.is_active
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              <Pause v-if="subscription.is_active" class="w-5 h-5" />
              <Play v-else class="w-5 h-5" />
            </button>
          </div>

          <!-- Next Delivery -->
          <div
            v-if="subscription.is_active"
            class="mt-3 flex items-center gap-2 text-sm"
          >
            <Clock class="w-4 h-4 text-purple-600" />
            <span class="text-gray-600">จัดส่งครั้งถัดไป:</span>
            <span class="font-medium text-purple-600">
              {{ formatNextDelivery(subscription.next_delivery_date) }}
            </span>
          </div>
        </div>

        <!-- Items Preview -->
        <div class="p-4 bg-gray-50">
          <div class="flex items-center gap-2 mb-2">
            <Package class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-600">
              {{ subscription.subscription_items?.length || 0 }} รายการ
            </span>
          </div>

          <!-- Items Grid -->
          <div class="flex gap-2 overflow-x-auto pb-1">
            <div
              v-for="item in subscription.subscription_items?.slice(0, 5)"
              :key="item.id"
              class="flex-shrink-0 relative"
            >
              <LazyImage
                :src="item.products?.image"
                :alt="item.products?.name"
                class="w-12 h-12 rounded-lg"
              />
              <span
                v-if="item.quantity > 1"
                class="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
              >
                {{ item.quantity }}
              </span>
            </div>
            <div
              v-if="subscription.subscription_items?.length > 5"
              class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs font-medium"
            >
              +{{ subscription.subscription_items.length - 5 }}
            </div>
          </div>

          <!-- Total -->
          <div class="mt-3 space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">ยอดรวมโดยประมาณ</span>
              <span class="text-gray-500">
                ฿{{ calculateTotal(subscription).toLocaleString() }}
              </span>
            </div>
            <!-- Discount Info -->
            <div
              v-if="discountInfo[subscription.id]"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-purple-600 flex items-center gap-1">
                <Percent class="w-3 h-3" />
                ส่วนลด Subscription ({{
                  discountInfo[subscription.id].discount_percent
                }}%)
              </span>
              <span class="text-purple-600">
                -฿{{
                  discountInfo[
                    subscription.id
                  ].discount_amount?.toLocaleString()
                }}
              </span>
            </div>
            <div
              class="flex items-center justify-between pt-1 border-t border-dashed"
            >
              <span class="font-medium text-gray-800">ยอดชำระ</span>
              <span class="font-bold text-[#007f3e] text-lg">
                ฿{{
                  (
                    discountInfo[subscription.id]?.final_total ||
                    calculateTotal(subscription)
                  ).toLocaleString()
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-3 flex gap-2 border-t">
          <button
            v-if="subscription.is_active"
            @click="handleProcessNow(subscription)"
            :disabled="processingId === subscription.id"
            class="flex-1 py-2 bg-[#007f3e] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <ShoppingBag
              v-if="processingId !== subscription.id"
              class="w-4 h-4"
            />
            <LoadingSpinner v-else class="w-4 h-4" />
            สั่งเลย
          </button>
          <button
            v-if="subscription.is_active"
            @click="handleSkip(subscription)"
            class="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg flex items-center justify-center gap-1"
          >
            <SkipForward class="w-4 h-4" />
            ข้าม
          </button>
          <router-link
            :to="`/customer/subscriptions/${subscription.id}`"
            class="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg flex items-center justify-center gap-1"
          >
            <Edit2 class="w-4 h-4" />
            แก้ไข
          </router-link>
          <button
            @click="showDeleteConfirm = subscription.id"
            class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- FAB - Add New -->
    <router-link
      v-if="subscriptions.length > 0"
      to="/customer/subscriptions/new"
      class="fixed bottom-24 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-purple-700 active:scale-95 transition-all"
    >
      <Plus class="w-6 h-6" />
    </router-link>

    <!-- Delete Confirmation Modal -->
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showDeleteConfirm = null"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm p-5">
          <h3 class="text-lg font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
          <p class="text-gray-600 text-sm mb-4">
            ต้องการลบรายการสั่งซื้ออัตโนมัตินี้หรือไม่?
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = null"
              class="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
            >
              ยกเลิก
            </button>
            <button
              @click="handleDelete(showDeleteConfirm)"
              :disabled="deletingId"
              class="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LoadingSpinner v-if="deletingId" class="w-4 h-4" />
              <span>{{ deletingId ? "กำลังลบ..." : "ลบ" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
