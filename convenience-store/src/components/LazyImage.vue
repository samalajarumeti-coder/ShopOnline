<script setup>
import { ref, computed, onMounted } from "vue";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

const props = defineProps({
  src: String,
  alt: String,
  class: String,
  placeholder: {
    type: String,
    default: PLACEHOLDER_IMAGE,
  },
});

const loaded = ref(false);
const error = ref(false);
const imgRef = ref(null);

// ใช้ placeholder ถ้าไม่มี src หรือ src เป็น empty string
const imageSrc = computed(() => {
  if (!props.src || props.src.trim() === "") return props.placeholder;
  return props.src;
});

// ตรวจสอบว่าเป็น external URL หรือไม่
const isExternalUrl = computed(() => {
  if (!props.src) return false;
  return props.src.startsWith("http://") || props.src.startsWith("https://");
});

onMounted(() => {
  if (imgRef.value?.complete && !imgRef.value?.naturalWidth) {
    error.value = true;
    loaded.value = true;
  } else if (imgRef.value?.complete) {
    loaded.value = true;
  }
});

const onLoad = () => {
  loaded.value = true;
};

const onError = () => {
  error.value = true;
  loaded.value = true;
};
</script>

<template>
  <div class="relative overflow-hidden" :class="props.class">
    <!-- Loading Skeleton -->
    <div v-if="!loaded" class="absolute inset-0 bg-gray-200 animate-pulse" />

    <!-- Error State - แสดง placeholder image -->
    <img
      v-if="error"
      :src="placeholder"
      :alt="alt || 'ไม่มีรูปภาพ'"
      class="w-full h-full object-cover"
    />

    <!-- Actual Image -->
    <img
      v-show="!error"
      ref="imgRef"
      :src="imageSrc"
      :alt="alt"
      @load="onLoad"
      @error="onError"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      loading="lazy"
    />
  </div>
</template>
