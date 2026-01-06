<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useCouponsStore } from "../stores/coupons";
import {
  ChevronLeft,
  Ticket,
  Copy,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-vue-next";
import { ref } from "vue";

const router = useRouter();
const couponsStore = useCouponsStore();

const copiedId = ref(null);

const activeCoupons = computed(() =>
  couponsStore.coupons.filter((c) => c.is_active && !c.is_used)
);

const usedCoupons = computed(() =>
  couponsStore.coupons.filter((c) => c.is_used)
);

const expiredCoupons = computed(() =>
  couponsStore.coupons.filter((c) => !c.is_active && !c.is_used)
);

const copyCouponCode = async (code, id) => {
  try {
    await navigator.clipboard.writeText(code);
    copiedId.value = id;
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDiscountText = (coupon) => {
  if (coupon.discount_type === "percentage") {
    return `ลด ${coupon.discount_value}%`;
  } else {
    return `ลด ${coupon.discount_value} บาท`;
  }
};

onMounted(() => {
  couponsStore.fetchCoupons();
});
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center gap-3 px-4 py-4">
        <button
          @click="router.back()"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft class="w-6 h-6 text-gray-700" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900">คูปองของฉัน</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="couponsStore.loading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
    </div>

    <div v-else class="p-4 space-y-4">
      <!-- Stats Card -->
      <div
        class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Ticket class="w-8 h-8" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ activeCoupons.length }}</h2>
            <p class="text-sm opacity-90">คูปองที่ใช้ได้</p>
          </div>
        </div>
        <p class="text-sm opacity-90">
          ใช้คูปองเพื่อรับส่วนลดพิเศษในการสั่งซื้อครั้งถัดไป
        </p>
      </div>

      <!-- Active Coupons -->
      <div v-if="activeCoupons.length > 0">
        <h3 class="text-sm font-semibold text-gray-500 px-2 mb-2">
          คูปองที่ใช้ได้
        </h3>
        <div class="space-y-3">
          <div
            v-for="coupon in activeCoupons"
            :key="coupon.id"
            class="bg-white rounded-xl overflow-hidden shadow-sm"
          >
            <!-- Coupon Design -->
            <div class="relative">
              <!-- Background Pattern -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50"
              ></div>

              <!-- Content -->
              <div class="relative p-4">
                <div class="flex items-start gap-4">
                  <!-- Icon -->
                  <div
                    class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  >
                    <Ticket class="w-8 h-8" />
                  </div>

                  <!-- Details -->
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-900 mb-1">
                      {{ coupon.name }}
                    </h4>
                    <p class="text-sm text-gray-600 mb-2">
                      {{ coupon.description }}
                    </p>

                    <!-- Discount Badge -->
                    <div
                      class="inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-2"
                    >
                      {{ getDiscountText(coupon) }}
                    </div>

                    <!-- Conditions -->
                    <div class="text-xs text-gray-500 space-y-1">
                      <p v-if="coupon.min_purchase">
                        ขั้นต่ำ {{ coupon.min_purchase }} บาท
                      </p>
                      <p v-if="coupon.max_discount">
                        ลดสูงสุด {{ coupon.max_discount }} บาท
                      </p>
                      <p class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        ใช้ได้ถึง {{ formatDate(coupon.valid_until) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Coupon Code -->
                <div
                  class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <p class="text-xs text-gray-500 mb-1">รหัสคูปอง</p>
                    <p class="font-mono font-bold text-lg text-gray-900">
                      {{ coupon.code }}
                    </p>
                  </div>
                  <button
                    @click="copyCouponCode(coupon.code, coupon.id)"
                    class="flex items-center gap-2 bg-[#007f3e] text-white px-4 py-2 rounded-lg hover:bg-[#006633] transition-colors"
                  >
                    <CheckCircle
                      v-if="copiedId === coupon.id"
                      class="w-4 h-4"
                    />
                    <Copy v-else class="w-4 h-4" />
                    <span class="text-sm font-medium">
                      {{ copiedId === coupon.id ? "คัดลอกแล้ว" : "คัดลอก" }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Decorative Circles -->
              <div
                class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f3f4f6] rounded-full"
              ></div>
              <div
                class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f3f4f6] rounded-full"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Used Coupons -->
      <div v-if="usedCoupons.length > 0">
        <h3 class="text-sm font-semibold text-gray-500 px-2 mb-2">
          คูปองที่ใช้แล้ว
        </h3>
        <div class="space-y-2">
          <div
            v-for="coupon in usedCoupons"
            :key="coupon.id"
            class="bg-white rounded-xl p-4 shadow-sm opacity-60"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-gray-900">{{ coupon.name }}</h4>
                <p class="text-sm text-gray-500">
                  {{ getDiscountText(coupon) }}
                </p>
              </div>
              <span
                class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
              >
                ใช้แล้ว
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="activeCoupons.length === 0 && usedCoupons.length === 0"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <div
          class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <Ticket class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีคูปอง</h3>
        <p class="text-gray-500 text-center mb-6">
          คุณจะได้รับคูปองจากโปรโมชั่นและกิจกรรมพิเศษ
        </p>
        <button
          @click="router.push('/customer/promotions')"
          class="bg-[#007f3e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
        >
          ดูโปรโมชั่น
        </button>
      </div>
    </div>
  </div>
</template>
