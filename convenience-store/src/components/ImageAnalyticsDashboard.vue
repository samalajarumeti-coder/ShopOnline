<script setup>
import { ref, onMounted } from "vue";
import {
  HardDrive,
  Image,
  FileType,
  Trash2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Loader2,
  X,
} from "lucide-vue-next";
import { useStorageAnalytics } from "../composables/useStorageAnalytics";

const props = defineProps({
  bucket: {
    type: String,
    default: "products",
  },
});

const emit = defineEmits(["close"]);

const {
  loading,
  storageStats,
  fileList,
  error,
  fetchFiles,
  findOrphanedFiles,
  deleteFiles,
  formatSize,
} = useStorageAnalytics();

const orphanedFiles = ref([]);
const showOrphaned = ref(false);
const deleting = ref(false);

onMounted(() => {
  fetchFiles(props.bucket);
});

const handleFindOrphaned = async () => {
  orphanedFiles.value = await findOrphanedFiles(props.bucket);
  showOrphaned.value = true;
};

const handleDeleteOrphaned = async () => {
  if (!confirm(`ยืนยันลบ ${orphanedFiles.value.length} ไฟล์ที่ไม่ได้ใช้?`))
    return;

  deleting.value = true;
  try {
    await deleteFiles(
      orphanedFiles.value.map((f) => f.name),
      props.bucket
    );
    orphanedFiles.value = [];
    showOrphaned.value = false;
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
  } finally {
    deleting.value = false;
  }
};

const getUsageColor = (percent) => {
  if (percent < 50) return "bg-green-500";
  if (percent < 80) return "bg-yellow-500";
  return "bg-red-500";
};
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white"
    >
      <div class="flex items-center gap-3">
        <HardDrive class="w-6 h-6" />
        <h2 class="text-lg font-semibold">Image Storage Analytics</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="fetchFiles(bucket)"
          :disabled="loading"
          class="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loading }" />
        </button>
        <button @click="emit('close')" class="p-2 hover:bg-white/20 rounded-lg">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
      <!-- Loading -->
      <div
        v-if="loading && !storageStats"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
      >
        {{ error }}
      </div>

      <!-- Stats -->
      <div v-else-if="storageStats" class="space-y-6">
        <!-- Usage Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-blue-600 mb-2">
              <HardDrive class="w-5 h-5" />
              <span class="text-sm font-medium">Total Storage</span>
            </div>
            <p class="text-2xl font-bold text-blue-700">
              {{ storageStats.totalSizeMB }} MB
            </p>
            <p class="text-xs text-blue-500">
              {{ storageStats.totalFiles }} files
            </p>
          </div>

          <div class="bg-green-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-green-600 mb-2">
              <Image class="w-5 h-5" />
              <span class="text-sm font-medium">Images</span>
            </div>
            <p class="text-2xl font-bold text-green-700">
              {{ storageStats.imageCount }}
            </p>
            <p class="text-xs text-green-500">
              {{ storageStats.webpPercent }}% WebP
            </p>
          </div>

          <div class="bg-purple-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp class="w-5 h-5" />
              <span class="text-sm font-medium">Last 30 Days</span>
            </div>
            <p class="text-2xl font-bold text-purple-700">
              {{ storageStats.recentSizeMB }} MB
            </p>
            <p class="text-xs text-purple-500">
              {{ storageStats.recentFiles }} files
            </p>
          </div>

          <div class="bg-orange-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-orange-600 mb-2">
              <AlertTriangle class="w-5 h-5" />
              <span class="text-sm font-medium">Remaining</span>
            </div>
            <p class="text-2xl font-bold text-orange-700">
              {{ storageStats.remainingMB }} MB
            </p>
            <p class="text-xs text-orange-500">of 1GB free tier</p>
          </div>
        </div>

        <!-- Usage Bar -->
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="flex justify-between text-sm mb-2">
            <span class="font-medium">Storage Usage</span>
            <span class="text-gray-600"
              >{{ storageStats.usagePercent }}% used</span
            >
          </div>
          <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="getUsageColor(storageStats.usagePercent)"
              :style="{ width: Math.min(storageStats.usagePercent, 100) + '%' }"
            />
          </div>
          <p class="text-xs text-gray-500 mt-2">
            {{ storageStats.totalSizeMB }} MB / 1024 MB (Supabase Free Tier)
          </p>
        </div>

        <!-- File Types -->
        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-medium mb-3 flex items-center gap-2">
            <FileType class="w-5 h-5 text-gray-600" />
            File Types
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="(info, type) in storageStats.byType"
              :key="type"
              class="bg-white rounded-lg p-3 border"
            >
              <p class="text-xs text-gray-500 truncate">{{ type }}</p>
              <p class="font-semibold">{{ info.count }} files</p>
              <p class="text-xs text-gray-400">{{ formatSize(info.size) }}</p>
            </div>
          </div>
        </div>

        <!-- Top 10 Largest Files -->
        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-medium mb-3">Top 10 Largest Files</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(file, i) in storageStats.topLargest"
              :key="file.name"
              class="flex items-center justify-between bg-white rounded-lg p-2 border text-sm"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-gray-400 w-5">{{ i + 1 }}.</span>
                <span class="truncate">{{ file.name }}</span>
              </div>
              <span class="text-gray-600 whitespace-nowrap ml-2">{{
                formatSize(file.size)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Cleanup Section -->
        <div class="bg-red-50 rounded-xl p-4 border border-red-200">
          <h3 class="font-medium mb-3 flex items-center gap-2 text-red-700">
            <Trash2 class="w-5 h-5" />
            Cleanup Unused Files
          </h3>

          <p class="text-sm text-red-600 mb-3">
            ค้นหาและลบไฟล์ที่ไม่ได้ใช้ในสินค้าใดๆ เพื่อประหยัด storage
          </p>

          <button
            @click="handleFindOrphaned"
            :disabled="loading"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            ค้นหาไฟล์ที่ไม่ได้ใช้
          </button>

          <!-- Orphaned Files List -->
          <div v-if="showOrphaned" class="mt-4">
            <div
              v-if="orphanedFiles.length === 0"
              class="p-3 bg-green-100 text-green-700 rounded-lg"
            >
              ✅ ไม่พบไฟล์ที่ไม่ได้ใช้
            </div>
            <div v-else class="space-y-2">
              <p class="text-sm font-medium text-red-700">
                พบ {{ orphanedFiles.length }} ไฟล์ที่ไม่ได้ใช้ ({{
                  formatSize(orphanedFiles.reduce((s, f) => s + f.size, 0))
                }})
              </p>
              <div
                class="max-h-32 overflow-y-auto bg-white rounded-lg border p-2"
              >
                <div
                  v-for="file in orphanedFiles"
                  :key="file.name"
                  class="text-xs text-gray-600 py-1"
                >
                  {{ file.name }} ({{ formatSize(file.size) }})
                </div>
              </div>
              <button
                @click="handleDeleteOrphaned"
                :disabled="deleting"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
                <Trash2 v-else class="w-4 h-4" />
                ลบทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
