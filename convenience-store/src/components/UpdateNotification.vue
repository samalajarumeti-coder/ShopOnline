<script setup>
import { useServiceWorker } from "../composables/useServiceWorker";
import { RefreshCw, X } from "lucide-vue-next";

const { updateAvailable, newVersion, updateServiceWorker } = useServiceWorker();

const dismiss = () => {
  updateAvailable.value = false;
};
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="updateAvailable"
      class="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-2xl p-4 z-[9999] border-2 border-green-400"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <RefreshCw class="w-6 h-6" />
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-lg mb-1">🎉 มีเวอร์ชันใหม่!</h3>
          <p class="text-sm text-green-50 mb-3">
            <span v-if="newVersion"
              >เวอร์ชัน {{ newVersion }} พร้อมใช้งานแล้ว</span
            >
            <span v-else>อัปเดตเพื่อใช้ฟีเจอร์ใหม่</span>
          </p>
          <div class="flex gap-2">
            <button
              @click="updateServiceWorker"
              class="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              อัปเดตเลย
            </button>
            <button
              @click="dismiss"
              class="px-3 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px) scale(0.9);
}
</style>
