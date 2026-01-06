<script setup>
import { ref, watch } from "vue";
import { Trophy, X } from "lucide-vue-next";

const props = defineProps({
  achievement: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const visible = ref(false);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      visible.value = true;
      // Auto close after 5 seconds
      setTimeout(() => {
        handleClose();
      }, 5000);
    }
  }
);

const handleClose = () => {
  visible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-[-100%] opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-[-100%] opacity-0"
  >
    <div
      v-if="visible && achievement"
      class="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
    >
      <div
        class="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 shadow-2xl"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 animate-bounce"
          >
            <span class="text-2xl">{{ achievement.icon }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 text-white">
            <div class="flex items-center gap-2 mb-1">
              <Trophy class="w-4 h-4" />
              <p class="text-xs font-semibold uppercase tracking-wide">
                ความสำเร็จใหม่!
              </p>
            </div>
            <h3 class="font-bold text-lg mb-1">{{ achievement.title }}</h3>
            <p class="text-sm opacity-90 mb-2">{{ achievement.description }}</p>
            <div
              class="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium"
            >
              +{{ achievement.points }} คะแนน
            </div>
          </div>

          <!-- Close Button -->
          <button
            @click="handleClose"
            class="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <X class="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
