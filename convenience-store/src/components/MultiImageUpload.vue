<script setup>
import { ref, computed, watch } from "vue";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  GripVertical,
  Zap,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { useImageOptimization } from "../composables/useImageOptimization";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxImages: {
    type: Number,
    default: 5,
  },
  bucket: {
    type: String,
    default: "products",
  },
  enableOptimization: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "upload-success",
  "upload-error",
  "optimized-images",
]);

const {
  processImage,
  processing: optimizing,
  progress: optimizeProgress,
} = useImageOptimization();

const images = ref([...props.modelValue]);
const uploading = ref(false);
const uploadError = ref(null);
const fileInput = ref(null);
const draggedIndex = ref(null);
const uploadProgress = ref("");

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(images.value)) {
      images.value = [...(newVal || [])];
    }
  },
  { deep: true }
);

const canAddMore = computed(() => images.value.length < props.maxImages);

const openFileDialog = () => {
  if (canAddMore.value) {
    fileInput.value?.click();
  }
};

const removeImage = (index) => {
  images.value.splice(index, 1);
  emit("update:modelValue", images.value);
};

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        const maxHeight = 1200;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], file.name, {
                type: "image/webp",
                lastModified: Date.now(),
              })
            );
          },
          "image/webp",
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const uploadToSupabase = async (file) => {
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(props.bucket)
    .upload(fileName, file, { cacheControl: "31536000", upsert: false });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(props.bucket).getPublicUrl(fileName);
  return publicUrl;
};

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const availableSlots = props.maxImages - images.value.length;
  const filesToUpload = files.slice(0, availableSlots);

  uploading.value = true;
  uploadError.value = null;
  const allOptimizedImages = [];

  try {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      uploadProgress.value = `กำลังอัพโหลด ${i + 1}/${filesToUpload.length}`;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
      }

      let url;
      if (props.enableOptimization) {
        // ใช้ Image Optimization Pipeline
        uploadProgress.value = `กำลัง optimize ${i + 1}/${
          filesToUpload.length
        }`;
        const optimized = await processImage(file, props.bucket);
        url = optimized.medium; // ใช้ medium เป็น default
        allOptimizedImages.push(optimized);
      } else {
        // Upload แบบปกติ
        const compressedFile = await compressImage(file);
        url = await uploadToSupabase(compressedFile);
      }

      images.value.push(url);
    }

    emit("update:modelValue", images.value);
    emit("upload-success", images.value);
    if (allOptimizedImages.length > 0) {
      emit("optimized-images", allOptimizedImages);
    }
  } catch (err) {
    console.error("Upload error:", err);
    uploadError.value =
      err.message || "อัพโหลดไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Supabase Storage";
    emit("upload-error", err);
  } finally {
    uploading.value = false;
    uploadProgress.value = "";
    if (fileInput.value) fileInput.value.value = "";
  }
};

// Drag and drop reordering
const onDragStart = (index) => {
  draggedIndex.value = index;
};

const onDragOver = (event, index) => {
  event.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === index) return;

  const draggedItem = images.value[draggedIndex.value];
  images.value.splice(draggedIndex.value, 1);
  images.value.splice(index, 0, draggedItem);
  draggedIndex.value = index;
};

const onDragEnd = () => {
  draggedIndex.value = null;
  emit("update:modelValue", images.value);
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">
        รูปภาพสินค้า ({{ images.length }}/{{ maxImages }})
      </label>
      <p class="text-xs text-gray-500">ลากเพื่อเรียงลำดับ</p>
    </div>

    <!-- Image Grid -->
    <div class="grid grid-cols-3 gap-3">
      <!-- Existing Images -->
      <div
        v-for="(image, index) in images"
        :key="index"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="(e) => onDragOver(e, index)"
        @dragend="onDragEnd"
        class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-move"
      >
        <img
          :src="image"
          :alt="`Product ${index + 1}`"
          class="w-full h-full object-cover"
        />

        <!-- Primary Badge -->
        <div
          v-if="index === 0"
          class="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full"
        >
          หลัก
        </div>

        <!-- Drag Handle -->
        <div
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical class="w-5 h-5 text-white drop-shadow-lg" />
        </div>

        <!-- Remove Button -->
        <button
          @click="removeImage(index)"
          class="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Upload Button -->
      <button
        v-if="canAddMore"
        @click="openFileDialog"
        :disabled="uploading || optimizing"
        class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Loader2
          v-if="uploading || optimizing"
          class="w-6 h-6 text-green-600 animate-spin"
        />
        <template v-else>
          <Upload class="w-6 h-6 text-gray-400" />
          <span class="text-xs text-gray-500">เพิ่มรูป</span>
        </template>
      </button>
    </div>

    <!-- Upload Progress -->
    <div
      v-if="uploadProgress || optimizing"
      class="flex items-center gap-2 text-sm text-green-600"
    >
      <Zap class="w-4 h-4" />
      <span>{{
        uploadProgress ||
        `Optimizing ${optimizeProgress.current}/${optimizeProgress.total}`
      }}</span>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      @change="handleFileChange"
      class="hidden"
    />

    <p class="text-xs text-gray-500">
      รูปแรกจะเป็นรูปหลักที่แสดงในรายการสินค้า
      <span v-if="enableOptimization" class="text-green-600"
        >• Auto-optimize เป็น 3 ขนาด (thumb/medium/large)</span
      >
    </p>

    <!-- Error Message -->
    <div
      v-if="uploadError"
      class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
    >
      <p class="font-medium">❌ {{ uploadError }}</p>
      <p class="text-xs mt-1">
        กรุณาตรวจสอบว่า:
        <br />• สร้าง Storage bucket "products" ใน Supabase แล้ว <br />• ตั้งค่า
        RLS policy ให้อนุญาต upload <br />• ดูคู่มือที่
        SUPABASE_STORAGE_SETUP.md
      </p>
    </div>
  </div>
</template>
