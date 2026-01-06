<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { ArrowUp } from "lucide-vue-next";

const showButton = ref(false);

const handleScroll = () => {
  showButton.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 scale-0"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-0"
  >
    <button
      v-if="showButton"
      @click="scrollToTop"
      class="fixed bottom-24 right-4 z-40 w-12 h-12 bg-[#007f3e] text-white rounded-full shadow-lg hover:bg-[#006633] active:scale-95 transition-all flex items-center justify-center"
      aria-label="กลับไปด้านบน"
    >
      <ArrowUp class="w-6 h-6" />
    </button>
  </Transition>
</template>
