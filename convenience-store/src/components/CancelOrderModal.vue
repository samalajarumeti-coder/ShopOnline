<script setup>
import { ref } from "vue";
import { X, AlertTriangle } from "lucide-vue-next";

const props = defineProps({
  show: Boolean,
  orderId: Number,
  loading: Boolean,
});

const emit = defineEmits(["close", "confirm"]);

const selectedReason = ref("");
const otherReason = ref("");

const reasons = [
  { id: "change_mind", label: "เปลี่ยนใจ" },
  { id: "wrong_order", label: "สั่งผิดรายการ" },
  { id: "found_cheaper", label: "เจอราคาถูกกว่า" },
  { id: "delivery_too_long", label: "รอนานเกินไป" },
  { id: "other", label: "อื่นๆ" },
];

const handleConfirm = () => {
  const reason =
    selectedReason.value === "other"
      ? otherReason.value
      : reasons.find((r) => r.id === selectedReason.value)?.label || "";
  emit("confirm", reason);
};

const handleClose = () => {
  selectedReason.value = "";
  otherReason.value = "";
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl w-full max-w-sm shadow-xl">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-bold text-gray-800">ยกเลิกคำสั่งซื้อ</h3>
            <button
              @click="handleClose"
              class="p-1 hover:bg-gray-100 rounded-full"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-4">
            <!-- Warning -->
            <div class="flex items-start gap-3 p-3 bg-amber-50 rounded-xl mb-4">
              <AlertTriangle
                class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
              />
              <div class="text-sm">
                <p class="font-medium text-amber-800">ยืนยันการยกเลิก?</p>
                <p class="text-amber-600 mt-1">
                  คำสั่งซื้อ #{{ orderId }} จะถูกยกเลิกและไม่สามารถกู้คืนได้
                </p>
              </div>
            </div>

            <!-- Reason Selection -->
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-700 mb-2">
                เหตุผลในการยกเลิก (ไม่บังคับ)
              </p>
              <div class="space-y-2">
                <label
                  v-for="reason in reasons"
                  :key="reason.id"
                  class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors"
                  :class="
                    selectedReason === reason.id
                      ? 'border-[#007f3e] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                >
                  <input
                    type="radio"
                    :value="reason.id"
                    v-model="selectedReason"
                    class="w-4 h-4 text-[#007f3e] focus:ring-[#007f3e]"
                  />
                  <span class="text-sm text-gray-700">{{ reason.label }}</span>
                </label>
              </div>

              <!-- Other reason input -->
              <Transition name="slide">
                <div v-if="selectedReason === 'other'" class="mt-3">
                  <input
                    v-model="otherReason"
                    type="text"
                    placeholder="ระบุเหตุผล..."
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#007f3e]"
                  />
                </div>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-4 border-t">
            <button
              @click="handleClose"
              :disabled="loading"
              class="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ไม่ใช่
            </button>
            <button
              @click="handleConfirm"
              :disabled="loading"
              class="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {{ loading ? "กำลังยกเลิก..." : "ยืนยันยกเลิก" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
