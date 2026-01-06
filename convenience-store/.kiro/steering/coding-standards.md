---
inclusion: always
---

# Coding Standards

## Vue Component Guidelines

```vue
<script setup>
// 1. Imports (external → internal)
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

// 2. Props & Emits
const props = defineProps({
  productId: { type: String, required: true }
})
const emit = defineEmits(['add-to-cart'])

// 3. Store & Router
const cartStore = useCartStore()
const router = useRouter()

// 4. Reactive State
const isLoading = ref(false)

// 5. Computed
const totalPrice = computed(() => /* ... */)

// 6. Methods
const handleClick = () => { /* ... */ }

// 7. Lifecycle
onMounted(() => { /* ... */ })
</script>

<template>
  <!-- Single root element preferred -->
</template>

<style scoped>
/* Component-specific styles */
</style>
```

## Pinia Store Pattern

```js
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";

export const useExampleStore = defineStore("example", () => {
  // State
  const items = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const itemCount = computed(() => items.value.length);

  // Actions
  const fetchItems = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await supabase.from("table").select("*");
      if (err) throw err;
      items.value = data;
    } catch (e) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  };

  return { items, isLoading, error, itemCount, fetchItems };
});
```

## Tailwind CSS Conventions

- Mobile-first: ใช้ base styles สำหรับ mobile, เพิ่ม `sm:`, `md:` สำหรับ larger screens
- Spacing: ใช้ consistent scale (4, 8, 12, 16, 24, 32)
- Colors: ใช้ semantic colors (`primary`, `success`, `error`)
- Max width สำหรับ mobile: `max-w-[480px] mx-auto`
