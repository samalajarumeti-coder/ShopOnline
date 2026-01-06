<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  CreditCard,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-vue-next";

const router = useRouter();

const paymentMethods = ref([
  {
    id: 1,
    type: "credit_card",
    brand: "Visa",
    last4: "4242",
    expiry: "12/25",
    isDefault: true,
  },
  {
    id: 2,
    type: "credit_card",
    brand: "Mastercard",
    last4: "5555",
    expiry: "08/26",
    isDefault: false,
  },
]);

const getBrandColor = (brand) => {
  const colors = {
    Visa: "from-blue-500 to-blue-700",
    Mastercard: "from-red-500 to-orange-600",
    "American Express": "from-green-500 to-teal-600",
  };
  return colors[brand] || "from-gray-500 to-gray-700";
};

const setDefault = (id) => {
  paymentMethods.value.forEach((method) => {
    method.isDefault = method.id === id;
  });
};

const deleteMethod = (id) => {
  if (confirm("คุณต้องการลบบัตรนี้ใช่หรือไม่?")) {
    paymentMethods.value = paymentMethods.value.filter((m) => m.id !== id);
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3">
          <button
            @click="router.back()"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft class="w-6 h-6 text-gray-700" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900">วิธีการชำระเงิน</h1>
        </div>
        <button
          class="flex items-center gap-2 bg-[#007f3e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#006633] transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>เพิ่มบัตร</span>
        </button>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Payment Methods -->
      <div v-if="paymentMethods.length > 0" class="space-y-3">
        <div v-for="method in paymentMethods" :key="method.id" class="relative">
          <!-- Card Design -->
          <div
            class="bg-gradient-to-br rounded-xl p-6 text-white shadow-lg"
            :class="getBrandColor(method.brand)"
          >
            <!-- Card Brand -->
            <div class="flex items-center justify-between mb-8">
              <span class="text-sm font-semibold opacity-90">{{
                method.brand
              }}</span>
              <CheckCircle v-if="method.isDefault" class="w-5 h-5" />
            </div>

            <!-- Card Number -->
            <div class="mb-6">
              <div
                class="flex items-center gap-2 text-xl font-mono tracking-wider"
              >
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span>{{ method.last4 }}</span>
              </div>
            </div>

            <!-- Card Details -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs opacity-70 mb-1">วันหมดอายุ</p>
                <p class="font-semibold">{{ method.expiry }}</p>
              </div>
              <CreditCard class="w-8 h-8 opacity-80" />
            </div>

            <!-- Chip Design -->
            <div
              class="absolute top-16 left-6 w-12 h-10 bg-yellow-400 rounded opacity-80"
            ></div>
          </div>

          <!-- Actions -->
          <div class="mt-3 flex gap-2">
            <button
              v-if="!method.isDefault"
              @click="setDefault(method.id)"
              class="flex-1 py-2 border border-[#007f3e] text-[#007f3e] rounded-lg font-medium hover:bg-[#007f3e] hover:text-white transition-colors"
            >
              ตั้งเป็นบัตรหลัก
            </button>
            <button
              v-else
              disabled
              class="flex-1 py-2 bg-green-50 text-green-600 rounded-lg font-medium cursor-default"
            >
              บัตรหลัก
            </button>
            <button
              @click="deleteMethod(method.id)"
              class="p-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 px-4">
        <div
          class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <CreditCard class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          ยังไม่มีบัตรชำระเงิน
        </h3>
        <p class="text-gray-500 text-center mb-6">
          เพิ่มบัตรเครดิต/เดบิตเพื่อชำระเงินได้สะดวกยิ่งขึ้น
        </p>
        <button
          class="flex items-center gap-2 bg-[#007f3e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
        >
          <Plus class="w-5 h-5" />
          <span>เพิ่มบัตรแรก</span>
        </button>
      </div>

      <!-- Other Payment Methods -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3">วิธีการชำระเงินอื่นๆ</h3>
        <div class="space-y-3">
          <div
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
          >
            <div
              class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <span class="text-2xl">💳</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">บัตรเครดิต/เดบิต</p>
              <p class="text-xs text-gray-500">Visa, Mastercard, JCB</p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
          >
            <div
              class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <span class="text-2xl">📱</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">พร้อมเพย์</p>
              <p class="text-xs text-gray-500">โอนผ่าน QR Code</p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
          >
            <div
              class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
            >
              <span class="text-2xl">🏦</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">โอนเงินผ่านธนาคาร</p>
              <p class="text-xs text-gray-500">ทุกธนาคาร</p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
          >
            <div
              class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
            >
              <span class="text-2xl">💵</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">เก็บเงินปลายทาง</p>
              <p class="text-xs text-gray-500">ชำระเมื่อได้รับสินค้า</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div class="flex gap-3">
          <div
            class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-xl">🔒</span>
          </div>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">ความปลอดภัย</p>
            <p>
              ข้อมูลบัตรของคุณได้รับการเข้ารหัสและปกป้องด้วยมาตรฐาน PCI DSS
              เราไม่เก็บข้อมูล CVV ของคุณ
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
