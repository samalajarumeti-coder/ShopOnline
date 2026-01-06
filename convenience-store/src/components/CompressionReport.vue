<script setup>
import { ref, computed, onMounted } from "vue";
import {
  TrendingDown,
  FileImage,
  Zap,
  Download,
  RefreshCw,
  Loader2,
  X,
  BarChart2,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";

const emit = defineEmits(["close"]);

const loading = ref(false);
const report = ref(null);
const error = ref(null);

// ขนาดโดยประมาณของแต่ละ format
const ESTIMATED_SIZES = {
  original_jpg: 500 * 1024, // 500KB average
  original_png: 800 * 1024, // 800KB average
  webp_large: 150 * 1024, // 150KB
  webp_medium: 60 * 1024, // 60KB
  webp_thumb: 15 * 1024, // 15KB
};

const fetchReport = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Get all files from storage
    const { data: files, error: listError } = await supabase.storage
      .from("products")
      .list("", { limit: 1000 });

    if (listError) throw listError;

    // Categorize files
    const stats = {
      totalFiles: 0,
      webpFiles: 0,
      jpgFiles: 0,
      pngFiles: 0,
      otherFiles: 0,
      totalSize: 0,
      webpSize: 0,
      originalSize: 0,
      thumbCount: 0,
      mediumCount: 0,
      largeCount: 0,
      originalCount: 0,
    };

    files
      ?.filter((f) => f.id)
      .forEach((file) => {
        const size = file.metadata?.size || 0;
        const name = file.name.toLowerCase();
        const type = file.metadata?.mimetype || "";

        stats.totalFiles++;
        stats.totalSize += size;

        if (type === "image/webp" || name.endsWith(".webp")) {
          stats.webpFiles++;
          stats.webpSize += size;

          if (name.includes("-thumb")) stats.thumbCount++;
          else if (name.includes("-medium")) stats.mediumCount++;
          else if (name.includes("-large")) stats.largeCount++;
          else if (name.includes("-original")) stats.originalCount++;
        } else if (
          type === "image/jpeg" ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg")
        ) {
          stats.jpgFiles++;
          stats.originalSize += size;
        } else if (type === "image/png" || name.endsWith(".png")) {
          stats.pngFiles++;
          stats.originalSize += size;
        } else {
          stats.otherFiles++;
        }
      });

    // Calculate savings
    const estimatedOriginalSize =
      stats.webpFiles * ESTIMATED_SIZES.original_jpg;
    const actualWebpSize = stats.webpSize;
    const savedBytes = Math.max(0, estimatedOriginalSize - actualWebpSize);
    const savingsPercent =
      estimatedOriginalSize > 0
        ? Math.round((savedBytes / estimatedOriginalSize) * 100)
        : 0;

    // Monthly bandwidth estimate (assuming 1000 page views/day, 5 images/page)
    const dailyImageLoads = 1000 * 5;
    const monthlyImageLoads = dailyImageLoads * 30;
    const avgImageSize =
      stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;
    const monthlyBandwidth = monthlyImageLoads * avgImageSize;
    const monthlyBandwidthSaved =
      monthlyImageLoads * (savedBytes / Math.max(stats.webpFiles, 1));

    report.value = {
      ...stats,
      savedBytes,
      savingsPercent,
      avgImageSize,
      monthlyBandwidth,
      monthlyBandwidthSaved,
      optimizationRate:
        stats.totalFiles > 0
          ? Math.round((stats.webpFiles / stats.totalFiles) * 100)
          : 0,
    };
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

onMounted(fetchReport);
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-teal-600 text-white"
    >
      <div class="flex items-center gap-3">
        <TrendingDown class="w-6 h-6" />
        <h2 class="text-lg font-semibold">Image Compression Report</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="fetchReport"
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
        v-if="loading && !report"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="w-8 h-8 animate-spin text-green-600" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
      >
        {{ error }}
      </div>

      <!-- Report -->
      <div v-else-if="report" class="space-y-6">
        <!-- Savings Highlight -->
        <div
          class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 text-center border border-green-200"
        >
          <div
            class="flex items-center justify-center gap-2 text-green-600 mb-2"
          >
            <Zap class="w-6 h-6" />
            <span class="text-sm font-medium">Total Bandwidth Saved</span>
          </div>
          <p class="text-4xl font-bold text-green-700">
            {{ report.savingsPercent }}%
          </p>
          <p class="text-lg text-green-600 mt-1">
            {{ formatSize(report.savedBytes) }} saved
          </p>
          <p class="text-xs text-green-500 mt-2">
            เทียบกับการใช้ JPG/PNG ดั้งเดิม
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-blue-600 mb-2">
              <FileImage class="w-5 h-5" />
              <span class="text-sm font-medium">Total Images</span>
            </div>
            <p class="text-2xl font-bold text-blue-700">
              {{ report.totalFiles }}
            </p>
            <p class="text-xs text-blue-500">
              {{ formatSize(report.totalSize) }}
            </p>
          </div>

          <div class="bg-green-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-green-600 mb-2">
              <Zap class="w-5 h-5" />
              <span class="text-sm font-medium">WebP Optimized</span>
            </div>
            <p class="text-2xl font-bold text-green-700">
              {{ report.optimizationRate }}%
            </p>
            <p class="text-xs text-green-500">{{ report.webpFiles }} files</p>
          </div>

          <div class="bg-purple-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-purple-600 mb-2">
              <BarChart2 class="w-5 h-5" />
              <span class="text-sm font-medium">Avg Image Size</span>
            </div>
            <p class="text-2xl font-bold text-purple-700">
              {{ formatSize(report.avgImageSize) }}
            </p>
            <p class="text-xs text-purple-500">per image</p>
          </div>

          <div class="bg-orange-50 rounded-xl p-4">
            <div class="flex items-center gap-2 text-orange-600 mb-2">
              <Download class="w-5 h-5" />
              <span class="text-sm font-medium">Monthly Savings</span>
            </div>
            <p class="text-2xl font-bold text-orange-700">
              {{ formatSize(report.monthlyBandwidthSaved) }}
            </p>
            <p class="text-xs text-orange-500">estimated @ 1K views/day</p>
          </div>
        </div>

        <!-- File Type Breakdown -->
        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-medium mb-3">File Type Breakdown</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-sm">WebP (Optimized)</span>
              </div>
              <span class="font-medium">{{ report.webpFiles }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full"
                :style="{ width: report.optimizationRate + '%' }"
              ></div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-sm">
              <div class="text-center p-2 bg-white rounded-lg">
                <p class="text-gray-500">JPG</p>
                <p class="font-semibold">{{ report.jpgFiles }}</p>
              </div>
              <div class="text-center p-2 bg-white rounded-lg">
                <p class="text-gray-500">PNG</p>
                <p class="font-semibold">{{ report.pngFiles }}</p>
              </div>
              <div class="text-center p-2 bg-white rounded-lg">
                <p class="text-gray-500">Other</p>
                <p class="font-semibold">{{ report.otherFiles }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Optimized Sizes Breakdown -->
        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-medium mb-3">Optimized Image Sizes</h3>
          <div class="grid grid-cols-4 gap-2 text-center text-sm">
            <div class="p-3 bg-white rounded-lg border">
              <p class="text-xs text-gray-500">Thumbnail</p>
              <p class="text-lg font-bold text-blue-600">
                {{ report.thumbCount }}
              </p>
              <p class="text-xs text-gray-400">150px</p>
            </div>
            <div class="p-3 bg-white rounded-lg border">
              <p class="text-xs text-gray-500">Medium</p>
              <p class="text-lg font-bold text-green-600">
                {{ report.mediumCount }}
              </p>
              <p class="text-xs text-gray-400">400px</p>
            </div>
            <div class="p-3 bg-white rounded-lg border">
              <p class="text-xs text-gray-500">Large</p>
              <p class="text-lg font-bold text-purple-600">
                {{ report.largeCount }}
              </p>
              <p class="text-xs text-gray-400">800px</p>
            </div>
            <div class="p-3 bg-white rounded-lg border">
              <p class="text-xs text-gray-500">Original</p>
              <p class="text-lg font-bold text-orange-600">
                {{ report.originalCount }}
              </p>
              <p class="text-xs text-gray-400">1200px</p>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 class="font-medium text-blue-800 mb-2">
            💡 Tips เพิ่มประสิทธิภาพ
          </h3>
          <ul class="text-sm text-blue-700 space-y-1">
            <li v-if="report.optimizationRate < 80">
              • ยังมีรูป {{ report.jpgFiles + report.pngFiles }} รูปที่ยังไม่ได้
              optimize เป็น WebP
            </li>
            <li v-if="report.thumbCount < report.webpFiles / 4">
              • ควรสร้าง thumbnail สำหรับรูปทั้งหมดเพื่อลด bandwidth บน mobile
            </li>
            <li v-if="report.avgImageSize > 100 * 1024">
              • ขนาดเฉลี่ยยังสูง ({{ formatSize(report.avgImageSize) }}) ลองลด
              quality ลงอีก
            </li>
            <li v-else>
              • ✅ ระบบ optimization ทำงานได้ดี! ขนาดเฉลี่ยอยู่ในเกณฑ์ที่ดี
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
