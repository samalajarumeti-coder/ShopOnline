<script setup>
import { ref, computed } from "vue";
import { Plus, X, Trash2 } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ options: {}, variants: [] }),
  },
});

const emit = defineEmits(["update:modelValue"]);

const variantOptions = ref({ ...props.modelValue.options });
const variants = ref([...props.modelValue.variants]);

const newOptionName = ref("");
const newOptionValue = ref("");

// Add new option type (e.g., "Size", "Color")
const addOption = () => {
  if (!newOptionName.value.trim()) return;
  const key = newOptionName.value.trim();
  if (!variantOptions.value[key]) {
    variantOptions.value[key] = [];
    newOptionName.value = "";
    updateModel();
  }
};

// Add value to option (e.g., "S", "M", "L" to "Size")
const addOptionValue = (optionKey) => {
  if (!newOptionValue.value.trim()) return;
  const value = newOptionValue.value.trim();
  if (!variantOptions.value[optionKey].includes(value)) {
    variantOptions.value[optionKey].push(value);
    newOptionValue.value = "";
    generateVariants();
  }
};

// Remove option value
const removeOptionValue = (optionKey, value) => {
  const index = variantOptions.value[optionKey].indexOf(value);
  if (index > -1) {
    variantOptions.value[optionKey].splice(index, 1);
    if (variantOptions.value[optionKey].length === 0) {
      delete variantOptions.value[optionKey];
    }
    generateVariants();
  }
};

// Generate all variant combinations
const generateVariants = () => {
  const options = Object.entries(variantOptions.value);
  if (options.length === 0) {
    variants.value = [];
    updateModel();
    return;
  }

  const combinations = [];
  const generate = (index, current) => {
    if (index === options.length) {
      combinations.push({ ...current });
      return;
    }
    const [key, values] = options[index];
    for (const value of values) {
      generate(index + 1, { ...current, [key]: value });
    }
  };
  generate(0, {});

  // Merge with existing variants to preserve price/stock
  variants.value = combinations.map((combo) => {
    const existing = variants.value.find(
      (v) => JSON.stringify(v.values) === JSON.stringify(combo)
    );
    return (
      existing || {
        values: combo,
        sku: generateSKU(combo),
        price: null,
        stock: 0,
      }
    );
  });

  updateModel();
};

// Generate SKU from variant values
const generateSKU = (values) => {
  return Object.values(values).join("-").toUpperCase().replace(/\s+/g, "-");
};

const updateModel = () => {
  emit("update:modelValue", {
    options: variantOptions.value,
    variants: variants.value,
  });
};

const hasVariants = computed(
  () => Object.keys(variantOptions.value).length > 0
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">ตัวเลือกสินค้า (Variants)</label>
      <p class="text-xs text-gray-500">เช่น ขนาด, สี, รสชาติ</p>
    </div>

    <!-- Add Option Type -->
    <div class="flex gap-2">
      <input
        v-model="newOptionName"
        type="text"
        placeholder="ชื่อตัวเลือก (เช่น ขนาด, สี)"
        class="flex-1 border rounded-lg px-3 py-2 text-sm"
        @keyup.enter="addOption"
      />
      <button
        type="button"
        @click="addOption"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        เพิ่ม
      </button>
    </div>

    <!-- Option Values -->
    <div v-if="Object.keys(variantOptions).length > 0" class="space-y-3">
      <div
        v-for="(values, optionKey) in variantOptions"
        :key="optionKey"
        class="border rounded-lg p-3 bg-gray-50"
      >
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-sm">{{ optionKey }}</h4>
          <button
            type="button"
            @click="
              delete variantOptions[optionKey];
              generateVariants();
            "
            class="text-red-500 hover:text-red-700 text-xs"
          >
            ลบตัวเลือก
          </button>
        </div>

        <!-- Values -->
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="value in values"
            :key="value"
            class="inline-flex items-center gap-1 bg-white border rounded-full px-3 py-1 text-sm"
          >
            {{ value }}
            <button
              type="button"
              @click="removeOptionValue(optionKey, value)"
              class="text-gray-400 hover:text-red-500"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
        </div>

        <!-- Add Value -->
        <div class="flex gap-2">
          <input
            v-model="newOptionValue"
            type="text"
            :placeholder="`เพิ่มค่า ${optionKey}`"
            class="flex-1 border rounded-lg px-3 py-1.5 text-sm"
            @keyup.enter="addOptionValue(optionKey)"
          />
          <button
            type="button"
            @click="addOptionValue(optionKey)"
            class="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-sm"
          >
            เพิ่ม
          </button>
        </div>
      </div>
    </div>

    <!-- Generated Variants -->
    <div v-if="variants.length > 0" class="border-t pt-4">
      <h4 class="font-medium text-sm mb-3">
        รายการ Variants ({{ variants.length }})
      </h4>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(variant, index) in variants"
          :key="index"
          class="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg text-sm"
        >
          <div class="col-span-4">
            <p class="font-medium text-xs text-gray-600 mb-1">Variant</p>
            <p class="text-xs">
              {{
                Object.entries(variant.values)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
              }}
            </p>
          </div>
          <div class="col-span-3">
            <label class="text-xs text-gray-600">SKU</label>
            <input
              v-model="variant.sku"
              type="text"
              class="w-full border rounded px-2 py-1 text-xs"
              @input="updateModel"
            />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-600">ราคา</label>
            <input
              v-model.number="variant.price"
              type="number"
              step="0.01"
              placeholder="ราคา"
              class="w-full border rounded px-2 py-1 text-xs"
              @input="updateModel"
            />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-600">สต็อก</label>
            <input
              v-model.number="variant.stock"
              type="number"
              placeholder="0"
              class="w-full border rounded px-2 py-1 text-xs"
              @input="updateModel"
            />
          </div>
          <div class="col-span-1 flex justify-end">
            <button
              type="button"
              @click="
                variants.splice(index, 1);
                updateModel();
              "
              class="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!hasVariants" class="text-xs text-gray-500 text-center py-4">
      ยังไม่มีตัวเลือกสินค้า คลิก "เพิ่ม" เพื่อสร้างตัวเลือก
    </p>
  </div>
</template>
