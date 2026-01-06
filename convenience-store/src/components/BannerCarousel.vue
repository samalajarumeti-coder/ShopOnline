<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import LazyImage from "./LazyImage.vue";

const props = defineProps({
  banners: {
    type: Array,
    default: () => [],
  },
});

const currentIndex = ref(0);
let interval = null;

// Touch handling
const touchStartX = ref(0);
const touchEndX = ref(0);
const isDragging = ref(false);

const displayBanners = computed(() => props.banners);

const nextSlide = () => {
  if (displayBanners.value.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % displayBanners.value.length;
  }
};

const prevSlide = () => {
  if (displayBanners.value.length > 0) {
    currentIndex.value =
      (currentIndex.value - 1 + displayBanners.value.length) %
      displayBanners.value.length;
  }
};

const goToSlide = (index) => {
  currentIndex.value = index;
  resetAutoSlide();
};

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
  isDragging.value = true;
  if (interval) clearInterval(interval);
};

const handleTouchMove = (e) => {
  if (!isDragging.value) return;
  touchEndX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  const diff = touchStartX.value - touchEndX.value;
  const threshold = 50;

  if (diff > threshold) {
    nextSlide();
  } else if (diff < -threshold) {
    prevSlide();
  }

  startAutoSlide();
};

const startAutoSlide = () => {
  if (interval) clearInterval(interval);
  if (displayBanners.value.length > 1) {
    interval = setInterval(nextSlide, 4000);
  }
};

const resetAutoSlide = () => {
  if (interval) clearInterval(interval);
  startAutoSlide();
};

watch(
  () => props.banners,
  () => {
    currentIndex.value = 0;
    startAutoSlide();
  }
);

onMounted(() => {
  startAutoSlide();
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<template>
  <div
    v-if="displayBanners.length > 0"
    class="relative overflow-hidden rounded-2xl group"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div
      class="flex transition-transform duration-500 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="banner in displayBanners"
        :key="banner.id"
        class="w-full flex-shrink-0 relative"
      >
        <LazyImage
          :src="banner.image"
          :alt="banner.title"
          class="w-full h-40 rounded-2xl"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent rounded-2xl flex flex-col justify-end p-4"
        >
          <p class="text-white font-semibold text-base">{{ banner.title }}</p>
          <p class="text-white/80 text-sm">{{ banner.subtitle }}</p>
        </div>
      </div>
    </div>

    <!-- Dots -->
    <div
      v-if="displayBanners.length > 1"
      class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
    >
      <button
        v-for="(_, index) in displayBanners"
        :key="index"
        @click="goToSlide(index)"
        class="transition-all duration-300"
        :class="
          index === currentIndex
            ? 'w-5 h-1.5 bg-white rounded-full'
            : 'w-1.5 h-1.5 bg-white/50 rounded-full'
        "
      />
    </div>
  </div>
</template>
