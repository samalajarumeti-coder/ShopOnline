<script setup>
defineProps({
  type: {
    type: String,
    default: "card", // card, banner, category, text, circle
  },
  count: {
    type: Number,
    default: 1,
  },
  class: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <!-- Generic skeleton with class prop -->
  <div
    v-if="type === 'generic'"
    :class="['bg-gray-200 animate-pulse', $props.class]"
  />

  <!-- Product Card Skeleton -->
  <template v-else-if="type === 'card'">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-xl overflow-hidden shadow-sm"
    >
      <div class="aspect-square bg-gray-200 animate-pulse" />
      <div class="p-3 space-y-2">
        <div class="h-4 bg-gray-200 rounded animate-pulse" />
        <div class="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div class="flex justify-between items-center pt-1">
          <div class="h-5 bg-gray-200 rounded w-16 animate-pulse" />
          <div class="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  </template>

  <!-- Banner Skeleton -->
  <template v-else-if="type === 'banner'">
    <div class="mx-4 h-36 bg-gray-200 rounded-xl animate-pulse" />
  </template>

  <!-- Category Skeleton -->
  <template v-else-if="type === 'category'">
    <div v-for="i in count" :key="i" class="flex flex-col items-center gap-1.5">
      <div class="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
      <div class="h-3 bg-gray-200 rounded w-12 animate-pulse" />
    </div>
  </template>

  <!-- Flash Sale Item Skeleton -->
  <template v-else-if="type === 'flash-sale'">
    <div
      v-for="i in count"
      :key="i"
      class="flex-shrink-0 w-32 bg-white rounded-xl overflow-hidden shadow-sm"
    >
      <div class="h-28 bg-gray-200 animate-pulse" />
      <div class="p-2 space-y-1">
        <div class="h-3 bg-gray-200 rounded animate-pulse" />
        <div class="flex justify-between items-center">
          <div class="h-4 bg-gray-200 rounded w-10 animate-pulse" />
          <div class="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  </template>

  <!-- Text Line Skeleton -->
  <template v-else-if="type === 'text'">
    <div
      v-for="i in count"
      :key="i"
      class="h-4 bg-gray-200 rounded animate-pulse"
      :class="i % 2 === 0 ? 'w-3/4' : 'w-full'"
    />
  </template>

  <!-- Circle Skeleton -->
  <template v-else-if="type === 'circle'">
    <div class="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
  </template>
</template>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
