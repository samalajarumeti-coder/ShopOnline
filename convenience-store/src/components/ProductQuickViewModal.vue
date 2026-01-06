<script setup>
import { computed } from "vue";
import {
  X,
  Package,
  Tag,
  Eye,
  ShoppingCart,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-vue-next";

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "edit"]);

const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val);

const discount = computed(() => {
  if (!props.product?.original_price || !props.product?.price) return 0;
  return Math.round(
    (1 - props.product.price / props.product.original_price) * 100
  );
});

const stockStatus = computed(() => {
  const stock = props.product?.stock || 0;
  if (stock === 0)
    return { label: "หมด", color: "text-red-600 bg-red-50", icon: XCircle };
  if (stock <= 10)
    return {
      label: "เหลือน้อย",
      color: "text-orange-600 bg-orange-50",
      icon: Package,
    };
  return {
    label: "พร้อมขาย",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  };
});
</script>

<template>
  <div
    v-if="product"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10"
      >
        <h3 class="text-xl font-bold">รายละเอียดสินค้า</h3>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Left: Images -->
          <div>
            <div
              class="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3"
            >
              <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Package class="w-20 h-20 text-gray-300" />
              </div>
            </div>

            <!-- Additional Images -->
            <div
              v-if="product.images && product.images.length > 1"
              class="grid grid-cols-4 gap-2"
            >
              <div
                v-for="(img, i) in product.images.slice(0, 4)"
                :key="i"
                class="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  :src="img"
                  :alt="`${product.name} ${i + 1}`"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- Right: Details -->
          <div class="space-y-4">
            <!-- Title -->
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-1">
                {{ product.name }}
              </h2>
              <p v-if="product.name_en" class="text-gray-500">
                {{ product.name_en }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold text-green-600"
                >฿{{ formatCurrency(product.price) }}</span
              >
              <span
                v-if="product.original_price"
                class="text-lg text-gray-400 line-through"
              >
                ฿{{ formatCurrency(product.original_price) }}
              </span>
              <span
                v-if="discount > 0"
                class="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full"
              >
                -{{ discount }}%
              </span>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              <span
                v-if="product.is_flash_sale"
                class="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium"
              >
                <Zap class="w-4 h-4" />
                Flash Sale
              </span>
              <span
                v-if="product.is_active"
                class="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium"
              >
                <CheckCircle class="w-4 h-4" />
                เปิดขาย
              </span>
              <span
                v-else
                class="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
              >
                <XCircle class="w-4 h-4" />
                ปิดขาย
              </span>
            </div>

            <!-- Stock Status -->
            <div class="flex items-center gap-3 p-3 rounded-lg border">
              <component
                :is="stockStatus.icon"
                class="w-5 h-5"
                :class="stockStatus.color.split(' ')[0]"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-700">สถานะสต็อก</p>
                <p
                  :class="[
                    'text-sm font-medium',
                    stockStatus.color.split(' ')[0],
                  ]"
                >
                  {{ stockStatus.label }} ({{ product.stock }} ชิ้น)
                </p>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="flex items-center gap-2 text-blue-600 mb-1">
                  <Eye class="w-4 h-4" />
                  <span class="text-xs font-medium">ยอดดู</span>
                </div>
                <p class="text-xl font-bold text-blue-700">
                  {{ product.view_count || 0 }}
                </p>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="flex items-center gap-2 text-green-600 mb-1">
                  <ShoppingCart class="w-4 h-4" />
                  <span class="text-xs font-medium">ยอดขาย</span>
                </div>
                <p class="text-xl font-bold text-green-700">
                  {{ product.purchase_count || 0 }}
                </p>
              </div>
            </div>

            <!-- Category & Tags -->
            <div class="space-y-2">
              <div v-if="product.categories" class="flex items-center gap-2">
                <Tag class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-600">หมวดหมู่:</span>
                <span class="text-sm font-medium text-gray-900">{{
                  product.categories.name
                }}</span>
              </div>
              <div
                v-if="product.tags && product.tags.length > 0"
                class="flex items-start gap-2"
              >
                <Tag class="w-4 h-4 text-gray-400 mt-1" />
                <div class="flex-1">
                  <span class="text-sm text-gray-600">แท็ก:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="tag in product.tags"
                      :key="tag"
                      class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="product.description" class="border-t pt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">รายละเอียด</h4>
              <div
                class="text-sm text-gray-600 prose prose-sm max-w-none"
                v-html="product.description"
              ></div>
            </div>

            <!-- Variants -->
            <div
              v-if="product.has_variants && product.variant_options"
              class="border-t pt-4"
            >
              <h4 class="text-sm font-medium text-gray-700 mb-2">
                ตัวเลือกสินค้า
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(values, key) in product.variant_options"
                  :key="key"
                >
                  <span class="text-xs text-gray-500">{{ key }}:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="value in values"
                      :key="value"
                      class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border"
                    >
                      {{ value }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="border-t pt-4 text-xs text-gray-500 space-y-1">
              <p>ID: {{ product.id }}</p>
              <p v-if="product.created_at">
                สร้างเมื่อ:
                {{ new Date(product.created_at).toLocaleDateString("th-TH") }}
              </p>
              <p v-if="product.updated_at">
                อัพเดทล่าสุด:
                {{ new Date(product.updated_at).toLocaleDateString("th-TH") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
        <button
          @click="emit('close')"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ปิด
        </button>
        <button
          @click="emit('edit', product)"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          แก้ไขสินค้า
        </button>
      </div>
    </div>
  </div>
</template>
