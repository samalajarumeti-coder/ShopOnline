<script setup>
import { ref, computed } from "vue";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-vue-next";

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  alt: {
    type: String,
    default: "Product image",
  },
});

const currentIndex = ref(0);
const showLightbox = ref(false);

const currentImage = computed(() => props.images[currentIndex.value]);

const goToPrevious = () => {
  currentIndex.value =
    currentIndex.value === 0 ? props.images.length - 1 : currentIndex.value - 1;
};

const goToNext = () => {
  currentIndex.value =
    currentIndex.value === props.images.length - 1 ? 0 : currentIndex.value + 1;
};

const selectImage = (index) => {
  currentIndex.value = index;
};

const openLightbox = () => {
  showLightbox.value = true;
};

const closeLightbox = () => {
  showLightbox.value = false;
};
</script>

<template>
  <div class="space-y-3">
    <!-- Main Image -->
    <div class="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
      <img :src="currentImage" :alt="alt" class="w-full h-full object-cover" />

      <!-- Navigation Arrows (if multiple images) -->
      <template v-if="images.length > 1">
        <button
          @click="goToPrevious"
          class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <ChevronLeft class="w-6 h-6 text-gray-700" />
        </button>
        <button
          @click="goToNext"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <ChevronRight class="w-6 h-6 text-gray-700" />
        </button>
      </template>

      <!-- Zoom Button -->
      <button
        @click="openLightbox"
        class="absolute bottom-2 right-2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
      >
        <ZoomIn class="w-5 h-5 text-gray-700" />
      </button>

      <!-- Image Counter -->
      <div
        v-if="images.length > 1"
        class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>

    <!-- Thumbnails -->
    <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="(image, index) in images"
        :key="index"
        @click="selectImage(index)"
        class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
        :class="
          index === currentIndex
            ? 'border-[#007f3e] ring-2 ring-[#007f3e]/20'
            : 'border-gray-200 hover:border-gray-300'
        "
      >
        <img
          :src="image"
          :alt="`${alt} ${index + 1}`"
          class="w-full h-full object-cover"
        />
      </button>
    </div>
  </div>

  <!-- Lightbox -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showLightbox"
      class="fixed inset-0 z-50 bg-black flex items-center justify-center"
      @click="closeLightbox"
    >
      <!-- Close Button -->
      <button
        class="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X class="w-6 h-6 text-white" />
      </button>

      <!-- Image -->
      <img
        :src="currentImage"
        :alt="alt"
        class="max-w-full max-h-full object-contain p-4"
        @click.stop
      />

      <!-- Navigation -->
      <template v-if="images.length > 1">
        <button
          @click.stop="goToPrevious"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft class="w-6 h-6 text-white" />
        </button>
        <button
          @click.stop="goToNext"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronRight class="w-6 h-6 text-white" />
        </button>
      </template>

      <!-- Counter -->
      <div
        v-if="images.length > 1"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </Transition>
</template>
