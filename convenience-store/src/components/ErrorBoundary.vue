<script setup>
import { ref, onErrorCaptured } from "vue";
import { RefreshCw, WifiOff } from "lucide-vue-next";

const error = ref(null);
const errorInfo = ref("");

onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;
  console.error("Error caught:", err, info);
  return false; // prevent error from propagating
});

const retry = () => {
  error.value = null;
  errorInfo.value = "";
  window.location.reload();
};
</script>

<template>
  <div
    v-if="error"
    class="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
      <WifiOff class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 class="text-lg font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
      <p class="text-gray-500 text-sm mb-6">
        ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
      </p>
      <button
        @click="retry"
        class="w-full bg-[#007f3e] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
      >
        <RefreshCw class="w-5 h-5" />
        ลองใหม่
      </button>
    </div>
  </div>
  <slot v-else />
</template>
