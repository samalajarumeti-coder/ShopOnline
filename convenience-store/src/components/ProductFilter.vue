<script setup>
import { ref, computed } from "vue";
import { X, SlidersHorizontal, Check } from "lucide-vue-next";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "apply"]);

const selectedCategories = ref([]);
const priceRange = ref([0, 1000]);
const sortBy = ref("popular");

const sortOptions = [
  { value: "popular", label: "ยอดนิยม" },
  { value: "price_asc", label: "ราคา: ต่ำ - สูง" },
  { value: "price_desc", label: "ราคา: สูง - ต่ำ" },
  { value: "newest", label: "สินค้าใหม่" },
  { value: "name", label: "ชื่อ: ก-ฮ" },
];

const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryId);
  }
};

const isCategorySelected = (categoryId) => {
  return selectedCategories.value.includes(categoryId);
};

const clearFilters = () => {
  selectedCategories.value = [];
  priceRange.value = [0, 1000];
  sortBy.value = "popular";
};

const applyFilters = () => {
  emit("apply", {
    categories: selectedCategories.value,
    priceRange: priceRange.value,
    sortBy: sortBy.value,
  });
  emit("close");
};

const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedCategories.value.length > 0) count++;
  if (priceRange.value[0] > 0 || priceRange.value[1] < 1000) count++;
  if (sortBy.value !== "popular") count++;
  return count;
});
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div v-if="show" class="fixed inset-0 z-50 bg-white flex flex-col">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-4 border-b border-gray-200"
      >
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-5 h-5 text-gray-700" />
          <h2 class="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
          <span
            v-if="activeFiltersCount > 0"
            class="bg-[#007f3e] text-white text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {{ activeFiltersCount }}
          </span>
        </div>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X class="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Sort By -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">เรียงตาม</h3>
          <div class="space-y-2">
            <label
              v-for="option in sortOptions"
              :key="option.value"
              class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{
                'border-[#007f3e] bg-green-50': sortBy === option.value,
              }"
            >
              <input
                v-model="sortBy"
                type="radio"
                :value="option.value"
                class="w-4 h-4 text-[#007f3e] focus:ring-[#007f3e]"
              />
              <span class="text-gray-900">{{ option.label }}</span>
              <Check
                v-if="sortBy === option.value"
                class="w-5 h-5 text-[#007f3e] ml-auto"
              />
            </label>
          </div>
        </div>

        <!-- Categories -->
        <div v-if="categories.length > 0">
          <h3 class="font-semibold text-gray-900 mb-3">หมวดหมู่</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="category in categories"
              :key="category.id"
              @click="toggleCategory(category.id)"
              class="px-4 py-2 rounded-full border transition-colors"
              :class="
                isCategorySelected(category.id)
                  ? 'bg-[#007f3e] text-white border-[#007f3e]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#007f3e]'
              "
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- Price Range -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">ช่วงราคา</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <label class="text-sm text-gray-600 mb-1 block">ต่ำสุด</label>
                <input
                  v-model.number="priceRange[0]"
                  type="number"
                  min="0"
                  :max="priceRange[1]"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007f3e]"
                />
              </div>
              <span class="text-gray-500 mt-6">-</span>
              <div class="flex-1">
                <label class="text-sm text-gray-600 mb-1 block">สูงสุด</label>
                <input
                  v-model.number="priceRange[1]"
                  type="number"
                  :min="priceRange[0]"
                  max="10000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007f3e]"
                />
              </div>
            </div>
            <div
              class="flex items-center justify-between text-sm text-gray-600"
            >
              <span>฿{{ priceRange[0] }}</span>
              <span>฿{{ priceRange[1] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 p-4 space-y-2">
        <button
          @click="applyFilters"
          class="w-full bg-[#007f3e] text-white py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
        >
          ใช้ตัวกรอง
        </button>
        <button
          @click="clearFilters"
          class="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  </Transition>

  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 bg-black/50 z-40"
      @click="emit('close')"
    ></div>
  </Transition>
</template>
