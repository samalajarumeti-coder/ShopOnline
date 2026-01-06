<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cart";
import { useAddressesStore } from "../stores/addresses";
import { useOrdersStore } from "../stores/orders";
import { useCouponsStore } from "../stores/coupons";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  Plus,
  Tag,
  X,
  Check,
  Loader2,
  ShoppingBag,
  Truck,
  AlertCircle,
  ChevronRight,
  Ticket,
} from "lucide-vue-next";

const router = useRouter();
const cartStore = useCartStore();
const addressesStore = useAddressesStore();
const ordersStore = useOrdersStore();
const couponsStore = useCouponsStore();

const selectedAddressId = ref(null);
const paymentMethod = ref("cash");
const notes = ref("");
const loading = ref(false);
const pageLoading = ref(true);
const error = ref("");
const stockErrors = ref([]);
const couponCode = ref("");
const appliedCoupon = ref(null);
const couponDiscount = ref(0);
const couponLoading = ref(false);
const couponError = ref("");
const showCouponInput = ref(false);
const orderSuccess = ref(false);
const createdOrder = ref(null);

const deliveryFee = computed(() => (cartStore.totalPrice >= 200 ? 0 : 30));
const grandTotal = computed(
  () =>
    Math.max(0, cartStore.totalPrice - couponDiscount.value) + deliveryFee.value
);
const canCheckout = computed(
  () =>
    selectedAddressId.value &&
    cartStore.items.length > 0 &&
    stockErrors.value.length === 0 &&
    !loading.value
);

onMounted(async () => {
  // Router guard already handles auth check
  if (cartStore.items.length === 0) {
    router.replace("/customer/cart");
    return;
  }
  try {
    await Promise.all([
      addressesStore.fetchAddresses(),
      validateStock(),
      couponsStore.fetchMyCoupons(),
    ]);
    const defaultAddr = addressesStore.getDefaultAddress();
    if (defaultAddr) selectedAddressId.value = defaultAddr.id;
  } catch (e) {
    console.error("Checkout init error:", e);
  } finally {
    pageLoading.value = false;
  }
});

async function validateStock() {
  const productIds = cartStore.items.map((item) => item.id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock, is_active")
    .in("id", productIds);
  const errors = [];
  cartStore.items.forEach((item) => {
    const product = products?.find((p) => p.id === item.id);
    if (!product || !product.is_active)
      errors.push({
        id: item.id,
        name: item.name,
        message: "สินค้าไม่พร้อมจำหน่าย",
      });
    else if (product.stock < item.quantity)
      errors.push({
        id: item.id,
        name: item.name,
        message:
          product.stock === 0
            ? "สินค้าหมด"
            : "เหลือเพียง " + product.stock + " ชิ้น",
      });
  });
  stockErrors.value = errors;
}

async function applyCoupon() {
  if (!couponCode.value.trim()) return;
  couponLoading.value = true;
  couponError.value = "";
  try {
    const { coupon, discount } = await couponsStore.applyCoupon(
      couponCode.value,
      cartStore.totalPrice
    );
    appliedCoupon.value = coupon;
    couponDiscount.value = discount;
    showCouponInput.value = false;
  } catch (e) {
    couponError.value = e.message;
  } finally {
    couponLoading.value = false;
  }
}

function removeCoupon() {
  appliedCoupon.value = null;
  couponDiscount.value = 0;
  couponCode.value = "";
  couponError.value = "";
}
function applyMyCoupon(uc) {
  couponCode.value = uc.coupon.code;
  applyCoupon();
}

async function handleOrder() {
  console.log("handleOrder called", {
    canCheckout: canCheckout.value,
    selectedAddressId: selectedAddressId.value,
    cartItems: cartStore.items.length,
    stockErrors: stockErrors.value.length,
    loading: loading.value,
  });

  if (!canCheckout.value) {
    if (!selectedAddressId.value) {
      error.value = "กรุณาเลือกที่อยู่จัดส่ง";
    } else if (cartStore.items.length === 0) {
      error.value = "ตะกร้าว่างเปล่า";
    } else if (stockErrors.value.length > 0) {
      error.value = "กรุณาตรวจสอบสินค้าในตะกร้า";
    }
    console.log("Cannot checkout:", error.value);
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    console.log("Validating stock...");
    await validateStock();

    if (stockErrors.value.length > 0) {
      error.value = "กรุณาตรวจสอบสินค้าในตะกร้า";
      loading.value = false;
      return;
    }

    console.log("Creating order with:", {
      addressId: selectedAddressId.value,
      paymentMethod: paymentMethod.value,
      notes: notes.value,
      couponId: appliedCoupon.value?.id,
      discount: couponDiscount.value,
    });

    const order = await ordersStore.createOrder(
      selectedAddressId.value,
      paymentMethod.value,
      notes.value,
      appliedCoupon.value?.id,
      couponDiscount.value
    );

    console.log("Order created successfully:", order);
    createdOrder.value = order;
    orderSuccess.value = true;

    setTimeout(() => {
      router.replace("/customer/order/" + order.id);
    }, 2000);
  } catch (e) {
    console.error("Order error:", e);
    error.value = e.message || "เกิดข้อผิดพลาดในการสั่งซื้อ";
  } finally {
    loading.value = false;
  }
}

function goToOrders() {
  if (createdOrder.value) {
    router.replace("/customer/order/" + createdOrder.value.id);
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="orderSuccess"
        class="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <div
            class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check class="w-10 h-10 text-green-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">สั่งซื้อสำเร็จ!</h2>
          <p class="text-gray-500 mb-1">คำสั่งซื้อ #{{ createdOrder?.id }}</p>
          <p class="text-sm text-gray-400 mb-6">
            กำลังพาไปหน้าติดตามคำสั่งซื้อ...
          </p>
          <button
            @click="goToOrders"
            class="w-full bg-green-600 text-white py-3 rounded-xl font-medium"
          >
            ดูรายละเอียดคำสั่งซื้อ
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="bg-gray-100 min-h-screen pb-52">
    <div
      class="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10"
    >
      <button @click="router.back()" class="p-1 -ml-1">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">ยืนยันคำสั่งซื้อ</h1>
    </div>

    <div v-if="pageLoading" class="px-4 py-4 space-y-4">
      <div class="bg-white rounded-xl p-4 shadow-sm animate-pulse">
        <div class="h-5 bg-gray-200 rounded w-32 mb-3"></div>
        <div class="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    <div v-else class="px-4 py-4 space-y-4">
      <div
        v-if="stockErrors.length > 0"
        class="bg-red-50 border border-red-200 rounded-xl p-4"
      >
        <div class="flex items-start gap-2">
          <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-medium text-red-700 mb-2">
              สินค้าบางรายการไม่พร้อมจำหน่าย
            </p>
            <ul class="text-sm text-red-600 space-y-1">
              <li v-for="err in stockErrors" :key="err.id">
                {{ err.name }}: {{ err.message }}
              </li>
            </ul>
            <button
              @click="router.push('/customer/cart')"
              class="mt-3 text-sm text-red-700 font-medium underline"
            >
              กลับไปแก้ไขตะกร้า
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0" />
        <span>{{ error }}</span>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <ShoppingBag class="w-5 h-5 text-green-600" />
            <h3 class="font-bold">
              สินค้า ({{ cartStore.totalItems }} รายการ)
            </h3>
          </div>
          <button
            @click="router.push('/customer/cart')"
            class="text-green-600 text-sm font-medium"
          >
            แก้ไข
          </button>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="flex-shrink-0 relative"
          >
            <img
              :src="item.image || '/placeholder.png'"
              :alt="item.name"
              class="w-16 h-16 object-cover rounded-lg bg-gray-100"
            />
            <span
              class="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
              >{{ item.quantity }}</span
            >
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <MapPin class="w-5 h-5 text-green-600" />
            <h3 class="font-bold">ที่อยู่จัดส่ง</h3>
          </div>
          <router-link
            to="/customer/add-address?redirect=/customer/checkout"
            class="text-green-600 text-sm font-medium flex items-center gap-1"
          >
            <Plus class="w-4 h-4" />
            <span>เพิ่ม</span>
          </router-link>
        </div>
        <div v-if="addressesStore.loading" class="py-4 flex justify-center">
          <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
        </div>
        <div
          v-else-if="addressesStore.addresses.length === 0"
          class="text-center py-6 bg-gray-50 rounded-lg"
        >
          <MapPin class="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p class="text-gray-500 text-sm mb-3">ยังไม่มีที่อยู่จัดส่ง</p>
          <router-link
            to="/customer/add-address?redirect=/customer/checkout"
            class="inline-flex items-center gap-1 text-green-600 font-medium text-sm"
          >
            <Plus class="w-4 h-4" />
            <span>เพิ่มที่อยู่ใหม่</span>
          </router-link>
        </div>
        <div v-else class="space-y-2">
          <label
            v-for="addr in addressesStore.addresses"
            :key="addr.id"
            class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all"
            :class="
              selectedAddressId === addr.id
                ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                : 'border-gray-200'
            "
          >
            <input
              type="radio"
              :value="addr.id"
              v-model="selectedAddressId"
              class="mt-1 accent-green-600"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-sm">{{ addr.label }}</p>
                <span
                  v-if="addr.is_default"
                  class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full"
                  >ค่าเริ่มต้น</span
                >
              </div>
              <p class="text-gray-500 text-xs mt-0.5 line-clamp-2">
                {{ addr.address_line }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <Ticket class="w-5 h-5 text-green-600" />
          <h3 class="font-bold">คูปองส่วนลด</h3>
        </div>
        <div
          v-if="appliedCoupon"
          class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
        >
          <div class="flex items-center gap-2">
            <Tag class="w-5 h-5 text-green-600" />
            <div>
              <p class="font-medium text-green-700 text-sm">
                {{ appliedCoupon.code }}
              </p>
              <p class="text-xs text-green-600">
                ลด {{ couponDiscount.toFixed(2) }} บาท
              </p>
            </div>
          </div>
          <button
            @click="removeCoupon"
            class="p-1.5 hover:bg-green-100 rounded-full"
          >
            <X class="w-4 h-4 text-green-600" />
          </button>
        </div>
        <div v-else>
          <div v-if="showCouponInput" class="space-y-2">
            <div class="flex gap-2">
              <input
                v-model="couponCode"
                type="text"
                placeholder="ใส่รหัสคูปอง"
                class="flex-1 px-3 py-2 border rounded-lg text-sm uppercase"
                @keyup.enter="applyCoupon"
                :disabled="couponLoading"
              />
              <button
                @click="applyCoupon"
                :disabled="couponLoading || !couponCode.trim()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <Loader2 v-if="couponLoading" class="w-4 h-4 animate-spin" />
                <span v-else>ใช้</span>
              </button>
            </div>
            <p v-if="couponError" class="text-red-500 text-xs">
              {{ couponError }}
            </p>
            <button
              @click="showCouponInput = false"
              class="text-gray-500 text-xs"
            >
              ยกเลิก
            </button>
          </div>
          <button
            v-else
            @click="showCouponInput = true"
            class="w-full flex items-center justify-between p-3 border border-dashed border-gray-300 rounded-xl hover:border-green-600 transition-colors"
          >
            <span class="text-gray-600 text-sm">ใส่รหัสคูปอง</span>
            <ChevronRight class="w-4 h-4 text-gray-400" />
          </button>
          <div v-if="couponsStore.myCoupons.length > 0" class="mt-3">
            <p class="text-xs text-gray-500 mb-2">คูปองของฉัน</p>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="uc in couponsStore.myCoupons"
                :key="uc.id"
                @click="applyMyCoupon(uc)"
                class="flex-shrink-0 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
                {{ uc.coupon.code }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <CreditCard class="w-5 h-5 text-green-600" />
          <h3 class="font-bold">วิธีชำระเงิน</h3>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer"
            :class="
              paymentMethod === 'cash'
                ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                : 'border-gray-200'
            "
          >
            <input
              type="radio"
              value="cash"
              v-model="paymentMethod"
              class="accent-green-600"
            />
            <Banknote class="w-5 h-5 text-gray-500" />
            <span class="text-sm">เงินสด</span>
          </label>
          <label
            class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer"
            :class="
              paymentMethod === 'card'
                ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                : 'border-gray-200'
            "
          >
            <input
              type="radio"
              value="card"
              v-model="paymentMethod"
              class="accent-green-600"
            />
            <CreditCard class="w-5 h-5 text-gray-500" />
            <span class="text-sm">บัตร</span>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-bold mb-2">หมายเหตุ</h3>
        <textarea
          v-model="notes"
          placeholder="เช่น ฝากไว้หน้าบ้าน..."
          class="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
          rows="2"
        ></textarea>
      </div>

      <div class="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <Truck class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div class="text-sm">
          <p class="font-medium text-blue-800">จัดส่งภายใน 30-45 นาที</p>
          <p class="text-blue-600 text-xs mt-0.5">
            ฟรีค่าส่งเมื่อสั่งซื้อ 200 บาทขึ้นไป
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="!pageLoading"
      class="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg z-30"
    >
      <div class="px-4 py-3 space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">ราคาสินค้า</span>
          <span>{{ cartStore.totalPrice.toFixed(2) }} บาท</span>
        </div>
        <div
          v-if="couponDiscount > 0"
          class="flex justify-between text-green-600"
        >
          <span>ส่วนลดคูปอง</span>
          <span>-{{ couponDiscount.toFixed(2) }} บาท</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ค่าจัดส่ง</span>
          <span :class="deliveryFee === 0 ? 'text-green-600' : ''">{{
            deliveryFee === 0 ? "ฟรี" : deliveryFee + " บาท"
          }}</span>
        </div>
        <div class="border-t pt-2 flex justify-between font-bold text-base">
          <span>รวมทั้งหมด</span>
          <span class="text-green-600 text-lg"
            >{{ grandTotal.toFixed(2) }} บาท</span
          >
        </div>
      </div>
      <div class="px-4 pb-3">
        <button
          @click="handleOrder"
          :disabled="!canCheckout || loading"
          class="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 active:bg-green-700"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <span>{{ loading ? "กำลังสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ" }}</span>
        </button>
      </div>
    </div>
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
