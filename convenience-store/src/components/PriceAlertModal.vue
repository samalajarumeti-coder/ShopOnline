<script setup>
import { ref, computed, watch } from "vue";
import { X, Bell, TrendingDown, AlertCircle, Check } from "lucide-vue-next";
import { usePriceAlerts } from "../composables/usePriceAlerts";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

const { createAlert, updateAlert, getAlert, hasAlert } = usePriceAlerts();

const targetPrice = ref("");
const saving = ref(false);
const error = ref("");
const success = ref(false);

const existingAlert = computed(() => getAlert(props.product.id));

const discountPercent = computed(() => {
  if (!targetPrice.value || !props.product.price) return 0;
  const target = parseFloat(targetPrice.value);
  const current = props.product.price;
  if (target >= current) return 0;
  return Math.round(((current - target) / current) * 100);
});

const suggestedPrices = computed(() => {
  const current = props.product.price;
  return [
    { label: "5%", value: Math.round(current * 0.95 * 100) / 100 },
    { label: "10%", value: Math.round(current * 0.9 * 100) / 100 },
    { label: "15%", value: Math.round(current * 0.85 * 100) / 100 },
    { label: "20%", value: Math.round(current * 0.8 * 100) / 100 },
  ];
});

watch(
  () => props.show,
  (show) => {
    if (show) {
      if (existingAlert.value) {
        targetPrice.value = existingAlert.value.target_price.toString();
      } else {
        targetPrice.value = suggestedPrices.value[1].value.toString();
      }
      error.value = "";
      success.value = false;
    }
  }
);

const handleSubmit = async () => {
  error.value = "";
  const target = parseFloat(targetPrice.value);

  if (!target || target <= 0) {
    error.value = "กรุณาใส่ราคาที่ถูกต้อง";
    return;
  }

  if (target >= props.product.price) {
    error.value = "ราคาเป้าหมายต้องต่ำกว่าราคาปัจจุบัน";
    return;
  }

  saving.value = true;
  try {
    if (existingAlert.value) {
      await updateAlert(existingAlert.value.id, target);
    } else {
      await createAlert(props.product.id, target, props.product.price);
    }

    success.value = true;
    setTimeout(() => {
      emit("success");
      emit("close");
    }, 1500);
  } catch (e) {
    error.value = e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
  } finally {
    saving.value = false;
  }
};

const setSuggestedPrice = (price) => {
  targetPrice.value = price.toString();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click="emit('close')"
      >
        <div
          @click.stop
          class="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl"
        >
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Bell class="w-5 h-5 text-purple-600" />
              <h3 class="font-bold text-lg">
                {{
                  existingAlert ? "แก้ไขการแจ้งเตือน" : "ตั้งการแจ้งเตือนราคา"
                }}
              </h3>
            </div>
            <button
              @click="emit('close')"
              class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Success State -->
          <div
            v-if="success"
            class="p-8 flex flex-col items-center justify-center"
          >
            <div
              class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <Check class="w-8 h-8 text-green-600" />
            </div>
            <h4 class="text-lg font-bold text-gray-800 mb-2">สำเร็จ!</h4>
            <p class="text-gray-600 text-center">
              เราจะแจ้งเตือนคุณเมื่อราคาลดถึงเป้าหมาย
            </p>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="handleSubmit" class="p-4 space-y-4">
            <!-- Product Info -->
            <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                :src="product.image"
                :alt="product.name"
                class="w-16 h-16 object-cover rounded-lg"
              />
              <div class="flex-1">
                <h4 class="font-medium text-sm line-clamp-2">
                  {{ product.name }}
                </h4>
                <p class="text-green-700 font-bold mt-1">
                  ฿{{ product.price.toLocaleString() }}
                </p>
              </div>
            </div>

            <!-- Info Box -->
            <div
              class="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <AlertCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p class="text-blue-800">
                เราจะส่งการแจ้งเตือนให้คุณทันทีเมื่อราคาสินค้าลดถึงหรือต่ำกว่าราคาที่คุณตั้งไว้
              </p>
            </div>

            <!-- Target Price Input -->
            <div>
              <label class="block text-sm font-medium mb-2">
                ราคาเป้าหมาย (บาท)
              </label>
              <div class="relative">
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >฿</span
                >
                <input
                  v-model="targetPrice"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  class="w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <!-- Discount Preview -->
              <div
                v-if="discountPercent > 0"
                class="mt-2 flex items-center gap-2 text-sm"
              >
                <TrendingDown class="w-4 h-4 text-green-600" />
                <span class="text-green-600 font-medium">
                  ประหยัด {{ discountPercent }}% (฿{{
                    (product.price - parseFloat(targetPrice)).toFixed(2)
                  }})
                </span>
              </div>
            </div>

            <!-- Suggested Prices -->
            <div>
              <p class="text-sm font-medium mb-2">ราคาแนะนำ:</p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="price in suggestedPrices"
                  :key="price.label"
                  type="button"
                  @click="setSuggestedPrice(price.value)"
                  class="px-3 py-2 border rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-colors text-sm"
                  :class="
                    parseFloat(targetPrice) === price.value
                      ? 'bg-purple-50 border-purple-500 text-purple-700 font-medium'
                      : 'border-gray-300'
                  "
                >
                  <div class="text-xs text-gray-500">-{{ price.label }}</div>
                  <div class="font-medium">฿{{ price.value }}</div>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              <AlertCircle class="w-4 h-4 flex-shrink-0" />
              <span>{{ error }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="emit('close')"
                :disabled="saving"
                class="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Bell v-if="!saving" class="w-4 h-4" />
                <span v-if="saving">กำลังบันทึก...</span>
                <span v-else>{{
                  existingAlert ? "อัพเดท" : "ตั้งการแจ้งเตือน"
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white {
  transform: translateY(100%);
}

.modal-leave-to .bg-white {
  transform: translateY(100%);
}
</style>
