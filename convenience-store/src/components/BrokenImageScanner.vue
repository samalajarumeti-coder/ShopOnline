<script setup>
import { ref } from "vue";
import { useImageValidator } from "../composables/useImageValidator";
import {
  X,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ImageOff,
  Wrench,
  RefreshCw,
} from "lucide-vue-next";

const emit = defineEmits(["close", "fixed"]);

const {
  validating,
  scanProgress,
  brokenImages,
  scanLogs,
  scanAllBrokenImages,
  fixAllBrokenImages,
} = useImageValidator();

const hasScanned = ref(false);
const fixing = ref(false);
const fixResults = ref(null);

const startScan = async () => {
  hasScanned.value = true;
  fixResults.value = null;
  await scanAllBrokenImages();
};

const handleFixAll = async () => {
  fixing.value = true;
  try {
    fixResults.value = await fixAllBrokenImages();
    emit("fixed", fixResults.value);
  } finally {
    fixing.value = false;
  }
};
</script>

<template>
  <div
    class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
  >
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b bg-white">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <ImageOff class="w-5 h-5 text-red-500" />
        Broken Image Scanner
      </h3>
      <button
        @click="emit('close')"
        :disabled="validating || fixing"
        class="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        <X class="w-6 h-6" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-4 overflow-y-auto flex-1">
      <!-- Info Box -->
      <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p class="font-medium text-blue-800">🔍 ตรวจสอบรูปภาพที่เสียในระบบ</p>
        <p class="text-blue-700 mt-1">
          สแกนหารูปภาพที่โหลดไม่ได้ (404, timeout) และแก้ไขเป็น placeholder
          อัตโนมัติ
        </p>
      </div>

      <!-- Progress -->
      <div v-if="validating" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>กำลังสแกน...</span>
          <span
            >{{ scanProgress.current }}/{{ scanProgress.total }} ({{
              scanProgress.percent
            }}%)</span
          >
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all"
            :style="{ width: scanProgress.percent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Results Summary -->
      <div v-if="hasScanned && !validating" class="space-y-3">
        <div
          v-if="brokenImages.length === 0"
          class="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <CheckCircle class="w-8 h-8 text-green-500" />
          <div>
            <p class="font-medium text-green-800">ไม่พบรูปภาพที่เสีย!</p>
            <p class="text-sm text-green-700">รูปภาพทั้งหมดในระบบโหลดได้ปกติ</p>
          </div>
        </div>

        <div v-else class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-3 mb-3">
            <AlertTriangle class="w-8 h-8 text-red-500" />
            <div>
              <p class="font-medium text-red-800">
                พบ {{ brokenImages.length }} รูปที่เสีย
              </p>
              <p class="text-sm text-red-700">
                คลิก "แก้ไขทั้งหมด" เพื่อเปลี่ยนเป็น placeholder
              </p>
            </div>
          </div>

          <!-- Broken Images List -->
          <div class="max-h-40 overflow-y-auto space-y-2 mt-3">
            <div
              v-for="item in brokenImages"
              :key="`${item.productId}-${item.field}`"
              class="flex items-center gap-2 p-2 bg-white rounded border text-sm"
            >
              <ImageOff class="w-4 h-4 text-red-400 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ item.productName }}</p>
                <p class="text-xs text-gray-500 truncate">{{ item.error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fix Results -->
        <div v-if="fixResults" class="p-3 bg-gray-50 border rounded-lg text-sm">
          <p class="font-medium">ผลการแก้ไข:</p>
          <div class="flex gap-4 mt-1">
            <span class="text-green-600"
              >✅ สำเร็จ: {{ fixResults.success }}</span
            >
            <span v-if="fixResults.failed > 0" class="text-red-600"
              >❌ ล้มเหลว: {{ fixResults.failed }}</span
            >
          </div>
        </div>
      </div>

      <!-- Logs -->
      <div
        v-if="scanLogs.length > 0"
        class="bg-gray-900 text-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs"
      >
        <div
          v-for="(log, i) in scanLogs"
          :key="i"
          :class="[
            log.includes('✅') ? 'text-green-400' : '',
            log.includes('❌') ? 'text-red-400' : '',
            log.includes('🔍') || log.includes('📦') || log.includes('📊')
              ? 'text-blue-400'
              : '',
            !log.includes('✅') &&
            !log.includes('❌') &&
            !log.includes('🔍') &&
            !log.includes('📦') &&
            !log.includes('📊')
              ? 'text-gray-300'
              : '',
          ]"
        >
          {{ log }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex gap-3 p-4 border-t bg-gray-50">
      <button
        @click="emit('close')"
        :disabled="validating || fixing"
        class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        ปิด
      </button>

      <button
        v-if="brokenImages.length > 0 && !validating"
        @click="handleFixAll"
        :disabled="fixing"
        class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Loader2 v-if="fixing" class="w-4 h-4 animate-spin" />
        <Wrench v-else class="w-4 h-4" />
        {{ fixing ? "กำลังแก้ไข..." : "แก้ไขทั้งหมด" }}
      </button>

      <button
        @click="startScan"
        :disabled="validating || fixing"
        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Loader2 v-if="validating" class="w-4 h-4 animate-spin" />
        <Search v-else-if="!hasScanned" class="w-4 h-4" />
        <RefreshCw v-else class="w-4 h-4" />
        {{
          validating ? "กำลังสแกน..." : hasScanned ? "สแกนใหม่" : "เริ่มสแกน"
        }}
      </button>
    </div>
  </div>
</template>
