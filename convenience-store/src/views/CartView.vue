/* Path: /cart */
<script setup>
import { computed } from "vue";
import { useCartStore } from "../stores/cart";
import { useHaptic } from "../composables/useHaptic";
import { useSmartCartSuggestions } from "../composables/useSmartCartSuggestions";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-vue-next";
import LazyImage from "../components/LazyImage.vue";
import SmartCartSuggestions from "../components/SmartCartSuggestions.vue";
import CartDeals from "../components/CartDeals.vue";

const cartStore = useCartStore();
const haptic = useHaptic();
const { bundleDealActive, bundleDiscount } = useSmartCartSuggestions();

const deliveryFee = computed(() => (cartStore.totalPrice >= 200 ? 0 : 30));
const grandTotal = computed(
  () => cartStore.totalPrice + deliveryFee.value - bundleDiscount.value
);

const handleQuantityChange = (itemId, newQty) => {
  haptic.light();
  cartStore.updateQuantity(itemId, newQty);
};

const handleRemove = (itemId) => {
  haptic.medium();
  cartStore.removeFromCart(itemId);
};
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <div class="px-4 py-4">
      <h1 class="text-xl font-bold text-gray-800 mb-4">ตะกร้าสินค้า</h1>

      <!-- Empty Cart - Enhanced -->
      <div
        v-if="cartStore.items.length === 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <div class="relative mb-6">
          <div
            class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <ShoppingBag class="w-12 h-12 text-gray-300" />
          </div>
          <div
            class="absolute -top-1 -right-1 w-8 h-8 bg-[#007f3e]/10 rounded-full flex items-center justify-center"
          >
            <span class="text-[#007f3e] text-sm font-bold">0</span>
          </div>
        </div>
        <p class="text-gray-700 text-lg font-medium">ตะกร้าว่างเปล่า</p>
        <p class="text-gray-400 text-sm mt-1">เริ่มเลือกซื้อสินค้าที่คุณชอบ</p>
        <router-link
          to="/customer"
          class="mt-6 bg-[#007f3e] text-white px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-transform"
        >
          เลือกซื้อสินค้า
        </router-link>
      </div>

      <!-- Cart Items -->
      <div v-else class="space-y-3">
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="bg-white rounded-xl p-3 flex gap-3 shadow-sm"
        >
          <LazyImage
            :src="item.image"
            :alt="item.name"
            class="w-20 h-20 rounded-lg flex-shrink-0"
          />

          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-gray-800 line-clamp-2">
              {{ item.name }}
            </h3>
            <p class="text-[#007f3e] font-bold mt-1">฿{{ item.price }}</p>

            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center gap-2 bg-gray-100 rounded-full">
                <button
                  @click="handleQuantityChange(item.id, item.quantity - 1)"
                  class="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-full transition-colors"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="w-6 text-center font-medium">{{
                  item.quantity
                }}</span>
                <button
                  @click="handleQuantityChange(item.id, item.quantity + 1)"
                  class="w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-full transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>

              <button
                @click="handleRemove(item.id)"
                class="text-red-500 p-2 active:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Cart Deals - Show relevant deals -->
        <CartDeals class="mt-4" />

        <!-- Smart Cart Suggestions -->
        <SmartCartSuggestions class="mt-4" />

        <!-- Summary -->
        <div class="bg-white rounded-xl p-4 shadow-sm mt-4">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">ราคาสินค้า</span>
              <span class="font-medium"
                >฿{{ cartStore.totalPrice.toFixed(2) }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ค่าจัดส่ง</span>
              <span
                class="font-medium"
                :class="deliveryFee === 0 ? 'text-[#007f3e]' : ''"
              >
                {{ deliveryFee === 0 ? "ฟรี" : `฿${deliveryFee}` }}
              </span>
            </div>
            <!-- Bundle Discount -->
            <div
              v-if="bundleDealActive && bundleDiscount > 0"
              class="flex justify-between text-green-600"
            >
              <span class="flex items-center gap-1"> 🎁 Bundle Deal </span>
              <span class="font-medium">-฿{{ bundleDiscount.toFixed(2) }}</span>
            </div>
            <div v-if="deliveryFee > 0" class="text-xs text-[#f27220]">
              สั่งเพิ่มอีก ฿{{ (200 - cartStore.totalPrice).toFixed(0) }}
              เพื่อรับส่งฟรี!
            </div>
            <div class="border-t pt-2 flex justify-between">
              <span class="font-bold">รวมทั้งหมด</span>
              <span class="font-bold text-[#007f3e] text-lg"
                >฿{{ grandTotal.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Checkout Button -->
        <router-link
          to="/customer/checkout"
          class="w-full bg-[#007f3e] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-transform block text-center"
        >
          สั่งซื้อ ({{ cartStore.totalItems }} รายการ)
        </router-link>
      </div>
    </div>
  </div>
</template>
