<script setup>
import { ref, computed, onMounted } from "vue";

const PLACEHOLDER = "/placeholder-product.svg";

const props = defineProps({
  // รองรับทั้ง string URL หรือ object { thumbnail, medium, large, original }
  src: {
    type: [String, Object],
    default: null,
  },
  alt: {
    type: String,
    default: "",
  },
  // ขนาด container สำหรับเลือก default size
  sizes: {
    type: String,
    default: "(max-width: 480px) 150px, (max-width: 768px) 400px, 800px",
  },
  // Aspect ratio class
  aspectRatio: {
    type: String,
    default: "aspect-square",
  },
  // Object fit
  objectFit: {
    type: String,
    default: "cover",
  },
  // Enable lazy loading
  lazy: {
    type: Boolean,
    default: true,
  },
  // Placeholder image
  placeholder: {
    type: String,
    default: PLACEHOLDER,
  },
  // Priority loading (for above-the-fold images)
  priority: {
    type: Boolean,
    default: false,
  },
});

const loaded = ref(false);
const error = ref(false);
const imgRef = ref(null);

// สร้าง srcset จาก optimized images
const srcSet = computed(() => {
  if (!props.src || typeof props.src === "string") return "";

  const sets = [];
  if (props.src.thumbnail) sets.push(`${props.src.thumbnail} 150w`);
  if (props.src.medium) sets.push(`${props.src.medium} 400w`);
  if (props.src.large) sets.push(`${props.src.large} 800w`);
  if (props.src.original) sets.push(`${props.src.original} 1200w`);

  return sets.join(", ");
});

// เลือก src ที่เหมาะสม
const imageSrc = computed(() => {
  if (!props.src) return props.placeholder;

  // ถ้าเป็น string ใช้ตรงๆ
  if (typeof props.src === "string") {
    return props.src || props.placeholder;
  }

  // ถ้าเป็น object เลือก medium เป็น default
  return (
    props.src.medium ||
    props.src.large ||
    props.src.original ||
    props.placeholder
  );
});

// Fallback src เมื่อ error
const fallbackSrc = computed(() => {
  if (typeof props.src === "string") return props.placeholder;

  // ลอง fallback ไปขนาดอื่น
  if (props.src?.large) return props.src.large;
  if (props.src?.original) return props.src.original;
  return props.placeholder;
});

const objectFitClass = computed(() => {
  const fits = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
  };
  return fits[props.objectFit] || "object-cover";
});

onMounted(() => {
  if (imgRef.value?.complete) {
    if (imgRef.value.naturalWidth === 0) {
      error.value = true;
    }
    loaded.value = true;
  }
});

const onLoad = () => {
  loaded.value = true;
};

const onError = (e) => {
  error.value = true;
  loaded.value = true;
  // ลอง fallback
  if (
    e.target.src !== props.placeholder &&
    e.target.src !== fallbackSrc.value
  ) {
    e.target.src = fallbackSrc.value;
    error.value = false;
  }
};
</script>

<template>
  <div class="relative overflow-hidden bg-gray-100" :class="aspectRatio">
    <!-- Loading Skeleton -->
    <div v-if="!loaded" class="absolute inset-0 bg-gray-200 animate-pulse" />

    <!-- Responsive Image -->
    <img
      ref="imgRef"
      :src="imageSrc"
      :srcset="srcSet"
      :sizes="sizes"
      :alt="alt"
      :loading="priority ? 'eager' : lazy ? 'lazy' : 'eager'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      @load="onLoad"
      @error="onError"
      class="w-full h-full transition-opacity duration-300"
      :class="[objectFitClass, loaded ? 'opacity-100' : 'opacity-0']"
    />

    <!-- Error Overlay (optional visual indicator) -->
    <div
      v-if="error && imageSrc === placeholder"
      class="absolute inset-0 flex items-center justify-center bg-gray-100"
    >
      <svg
        class="w-8 h-8 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  </div>
</template>
