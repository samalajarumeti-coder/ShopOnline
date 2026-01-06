<script setup>
import { ref, computed } from "vue";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  bucket: {
    type: String,
    default: "products",
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024, // 5MB
  },
  accept: {
    type: String,
    default: "image/jpeg,image/png,image/webp",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "upload-success",
  "upload-error",
]);

const fileInput = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref("");
const preview = ref(props.modelValue);

const hasImage = computed(() => !!preview.value);

const openFileDialog = () => {
  fileInput.value?.click();
};

const removeImage = () => {
  preview.value = "";
  emit("update:modelValue", "");
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const validateFile = (file) => {
  // Check file type
  if (!props.accept.split(",").some((type) => file.type === type.trim())) {
    return "ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ WebP";
  }

  // Check file size
  if (file.size > props.maxSize) {
    const maxSizeMB = (props.maxSize / (1024 * 1024)).toFixed(1);
    return `ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)`;
  }

  return null;
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

        // Max dimensions
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
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const uploadToSupabase = async (file) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error: uploadError } = await supabase.storage
    .from(props.bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(props.bucket).getPublicUrl(filePath);

  return publicUrl;
};

const handleFileChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  error.value = "";

  // Validate
  const validationError = validateFile(file);
  if (validationError) {
    error.value = validationError;
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 0;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.value = e.target.result;
    };
    reader.readAsDataURL(file);

    // Compress image
    uploadProgress.value = 30;
    const compressedFile = await compressImage(file);

    // Upload to Supabase
    uploadProgress.value = 60;
    const url = await uploadToSupabase(compressedFile);

    uploadProgress.value = 100;
    preview.value = url;
    emit("update:modelValue", url);
    emit("upload-success", url);
  } catch (err) {
    console.error("Upload error:", err);
    error.value = err.message || "เกิดข้อผิดพลาดในการอัปโหลด";
    preview.value = props.modelValue;
    emit("upload-error", err);
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};
</script>

<template>
  <div class="space-y-2">
    <!-- Upload Area -->
    <div
      v-if="!hasImage"
      @click="openFileDialog"
      class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#007f3e] hover:bg-gray-50 transition-colors"
      :class="{ 'border-red-300 bg-red-50': error }"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileChange"
        class="hidden"
      />

      <div v-if="!uploading" class="flex flex-col items-center gap-3">
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <Upload class="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p class="font-medium text-gray-900 mb-1">คลิกเพื่ออัปโหลดรูปภาพ</p>
          <p class="text-sm text-gray-500">
            JPG, PNG หรือ WebP (สูงสุด
            {{ (maxSize / (1024 * 1024)).toFixed(0) }}MB)
          </p>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-3">
        <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
        <div class="w-full max-w-xs">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>กำลังอัปโหลด...</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-[#007f3e] h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview -->
    <div v-else class="relative group">
      <div class="aspect-square rounded-xl overflow-hidden bg-gray-100">
        <img :src="preview" alt="Preview" class="w-full h-full object-cover" />
      </div>

      <!-- Actions Overlay -->
      <div
        class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2"
      >
        <button
          @click="openFileDialog"
          class="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title="เปลี่ยนรูป"
        >
          <ImageIcon class="w-5 h-5 text-gray-700" />
        </button>
        <button
          @click="removeImage"
          class="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title="ลบรูป"
        >
          <X class="w-5 h-5 text-red-500" />
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileChange"
        class="hidden"
      />
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Success Message -->
    <div
      v-if="hasImage && !uploading && !error"
      class="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg"
    >
      <CheckCircle class="w-4 h-4 flex-shrink-0" />
      <span>อัปโหลดสำเร็จ</span>
    </div>
  </div>
</template>
