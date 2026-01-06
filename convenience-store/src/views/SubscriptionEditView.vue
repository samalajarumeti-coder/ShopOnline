<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Calendar,
  MapPin,
  CreditCard,
  Banknote,
  Search,
  X,
  Check,
} from "lucide-vue-next";
import { useSubscriptions } from "../composables/useSubscriptions";
import { useAddressesStore } from "../stores/addresses";
import { useProductsStore } from "../stores/products";
import { useAuthStore } from "../stores/auth";
import LazyImage from "../components/LazyImage.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import SubscriptionRecommendations from "../components/SubscriptionRecommendations.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const addressesStore = useAddressesStore();
const productsStore = useProductsStore();
const {
  subscriptions,
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  addItem,
  updateItemQuantity,
  removeItem,
  loading,
} = useSubscriptions();

const isEdit = computed(() => route.params.id && route.params.id !== "new");
const subscription = ref(null);

// Form data
const form = ref({
  name: "รายการสั่งซื้อประจำ",
  frequency: "weekly",
  nextDeliveryDate: "",
  addressId: null,
  paymentMethod: "cash",
  autoConfirm: false,
  notes: "",
});

const selectedItems = ref([]); // [{ productId, quantity, product }]
const showProductPicker = ref(false);
const searchQuery = ref("");
const saving = ref(false);

// Frequency options
const frequencyOptions = [
  { value: "weekly", label: "ทุกสัปดาห์", days: 7 },
  { value: "biweekly", label: "ทุก 2 สัปดาห์", days: 14 },
  { value: "monthly", label: "ทุกเดือน", days: 30 },
];

// Set default next delivery date
const setDefaultDate = () => {
  const date = new Date();
  const option = frequencyOptions.find((o) => o.value === form.value.frequency);
  date.setDate(date.getDate() + (option?.days || 7));
  form.value.nextDeliveryDate = date.toISOString().split("T")[0];
};

// Watch frequency change
watch(
  () => form.value.frequency,
  () => {
    if (!isEdit.value) {
      setDefaultDate();
    }
  }
);

// Filtered products for picker
const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return productsStore.products.slice(0, 20);

  const query = searchQuery.value.toLowerCase();
  return productsStore.products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.name_en?.toLowerCase().includes(query)
    )
    .slice(0, 20);
});

// Calculate total
const estimatedTotal = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
});

// Selected product IDs for recommendations
const selectedProductIds = computed(() => {
  return selectedItems.value.map((item) => item.productId);
});

// Add product to selection
const addProduct = (product) => {
  const existing = selectedItems.value.find((i) => i.productId === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    selectedItems.value.push({
      productId: product.id,
      quantity: 1,
      product,
    });
  }
};

// Handle recommendation add
const handleRecommendationAdd = (product) => {
  addProduct(product);
};

// Update quantity
const updateQuantity = (productId, delta) => {
  const item = selectedItems.value.find((i) => i.productId === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    selectedItems.value = selectedItems.value.filter(
      (i) => i.productId !== productId
    );
  }
};

// Remove product
const removeProduct = (productId) => {
  selectedItems.value = selectedItems.value.filter(
    (i) => i.productId !== productId
  );
};

// Check if product is selected
const isSelected = (productId) => {
  return selectedItems.value.some((i) => i.productId === productId);
};

// Get selected quantity
const getSelectedQuantity = (productId) => {
  return (
    selectedItems.value.find((i) => i.productId === productId)?.quantity || 0
  );
};

// Save subscription
const handleSave = async () => {
  if (selectedItems.value.length === 0) {
    alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
    return;
  }

  if (!form.value.addressId) {
    alert("กรุณาเลือกที่อยู่จัดส่ง");
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      // Update existing subscription
      await updateSubscription(route.params.id, {
        name: form.value.name,
        frequency: form.value.frequency,
        next_delivery_date: form.value.nextDeliveryDate,
        address_id: form.value.addressId,
        payment_method: form.value.paymentMethod,
        auto_confirm: form.value.autoConfirm,
        notes: form.value.notes,
      });

      // Update items (simplified - remove all and re-add)
      // In production, you'd want to diff and update only changed items
      for (const item of selectedItems.value) {
        await addItem(route.params.id, item.productId, item.quantity);
      }
    } else {
      // Create new subscription
      await createSubscription({
        name: form.value.name,
        frequency: form.value.frequency,
        nextDeliveryDate: form.value.nextDeliveryDate,
        addressId: form.value.addressId,
        paymentMethod: form.value.paymentMethod,
        autoConfirm: form.value.autoConfirm,
        notes: form.value.notes,
        items: selectedItems.value.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
    }

    router.push("/customer/subscriptions");
  } catch (e) {
    alert("เกิดข้อผิดพลาด: " + e.message);
  } finally {
    saving.value = false;
  }
};

// Load data
onMounted(async () => {
  await Promise.all([
    addressesStore.fetchAddresses(),
    productsStore.fetchProducts(),
  ]);

  // Set default address
  const defaultAddr = addressesStore.getDefaultAddress();
  if (defaultAddr) {
    form.value.addressId = defaultAddr.id;
  }

  if (isEdit.value) {
    await fetchSubscriptions();
    subscription.value = subscriptions.value.find(
      (s) => s.id === route.params.id
    );

    if (subscription.value) {
      form.value = {
        name: subscription.value.name,
        frequency: subscription.value.frequency,
        nextDeliveryDate: subscription.value.next_delivery_date,
        addressId: subscription.value.address_id,
        paymentMethod: subscription.value.payment_method,
        autoConfirm: subscription.value.auto_confirm,
        notes: subscription.value.notes || "",
      };

      // Load items
      selectedItems.value =
        subscription.value.subscription_items?.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: item.products,
        })) || [];
    }
  } else {
    setDefaultDate();
  }
});
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen pb-24">
    <!-- Header -->
    <div
      class="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10"
    >
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">
        {{ isEdit ? "แก้ไขรายการ" : "สร้างรายการใหม่" }}
      </h1>
    </div>

    <div class="px-4 py-4 space-y-4">
      <!-- Name -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >ชื่อรายการ</label
        >
        <input
          v-model="form.name"
          type="text"
          placeholder="เช่น ของใช้ประจำสัปดาห์"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
        />
      </div>

      <!-- Frequency -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >ความถี่ในการสั่ง</label
        >
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in frequencyOptions"
            :key="option.value"
            @click="form.frequency = option.value"
            class="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
            :class="
              form.frequency === option.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            "
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Next Delivery Date -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Calendar class="w-4 h-4 inline mr-1" />
          วันจัดส่งครั้งแรก
        </label>
        <input
          v-model="form.nextDeliveryDate"
          type="date"
          :min="new Date().toISOString().split('T')[0]"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
        />
      </div>

      <!-- Address -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <MapPin class="w-4 h-4 inline mr-1" />
          ที่อยู่จัดส่ง
        </label>
        <select
          v-model="form.addressId"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
        >
          <option :value="null" disabled>เลือกที่อยู่</option>
          <option
            v-for="addr in addressesStore.addresses"
            :key="addr.id"
            :value="addr.id"
          >
            {{ addr.label }} - {{ addr.address_line?.substring(0, 30) }}...
          </option>
        </select>
        <router-link
          to="/customer/add-address"
          class="text-sm text-[#007f3e] mt-2 inline-block"
        >
          + เพิ่มที่อยู่ใหม่
        </router-link>
      </div>

      <!-- Payment Method -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >วิธีชำระเงิน</label
        >
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="form.paymentMethod = 'cash'"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
            :class="
              form.paymentMethod === 'cash'
                ? 'bg-[#007f3e] text-white'
                : 'bg-gray-100 text-gray-700'
            "
          >
            <Banknote class="w-4 h-4" />
            เงินสด
          </button>
          <button
            @click="form.paymentMethod = 'card'"
            class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
            :class="
              form.paymentMethod === 'card'
                ? 'bg-[#007f3e] text-white'
                : 'bg-gray-100 text-gray-700'
            "
          >
            <CreditCard class="w-4 h-4" />
            บัตรเครดิต
          </button>
        </div>
      </div>

      <!-- Auto Confirm -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium text-gray-800">ยืนยันอัตโนมัติ</p>
            <p class="text-xs text-gray-500">
              ระบบจะยืนยันคำสั่งซื้อโดยไม่ต้องรอการอนุมัติ
            </p>
          </div>
          <div
            class="w-12 h-6 rounded-full transition-colors relative"
            :class="form.autoConfirm ? 'bg-[#007f3e]' : 'bg-gray-300'"
            @click="form.autoConfirm = !form.autoConfirm"
          >
            <div
              class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
              :class="form.autoConfirm ? 'translate-x-7' : 'translate-x-1'"
            />
          </div>
        </label>
      </div>

      <!-- Selected Items -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-gray-700"
            >สินค้าในรายการ</label
          >
          <button
            @click="showProductPicker = true"
            class="text-sm text-purple-600 font-medium flex items-center gap-1"
          >
            <Plus class="w-4 h-4" />
            เพิ่มสินค้า
          </button>
        </div>

        <!-- Empty -->
        <div
          v-if="selectedItems.length === 0"
          class="text-center py-8 text-gray-400"
        >
          <p>ยังไม่มีสินค้า</p>
          <button
            @click="showProductPicker = true"
            class="mt-2 text-purple-600 font-medium"
          >
            เพิ่มสินค้า
          </button>
        </div>

        <!-- Items List -->
        <div v-else class="space-y-3">
          <div
            v-for="item in selectedItems"
            :key="item.productId"
            class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
          >
            <LazyImage
              :src="item.product?.image"
              :alt="item.product?.name"
              class="w-12 h-12 rounded-lg"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">
                {{ item.product?.name }}
              </p>
              <p class="text-xs text-[#007f3e]">฿{{ item.product?.price }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="updateQuantity(item.productId, -1)"
                class="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center"
              >
                <Minus class="w-4 h-4 text-gray-600" />
              </button>
              <span class="w-8 text-center font-bold text-sm">{{
                item.quantity
              }}</span>
              <button
                @click="updateQuantity(item.productId, 1)"
                class="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <Plus class="w-4 h-4 text-white" />
              </button>
            </div>
            <button
              @click="removeProduct(item.productId)"
              class="p-1 text-red-500"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Total -->
        <div
          v-if="selectedItems.length > 0"
          class="mt-4 pt-3 border-t flex justify-between"
        >
          <span class="text-gray-600">ยอดรวมโดยประมาณ</span>
          <span class="font-bold text-[#007f3e]"
            >฿{{ estimatedTotal.toLocaleString() }}</span
          >
        </div>

        <!-- Recommendations -->
        <SubscriptionRecommendations
          v-if="selectedItems.length > 0"
          :selected-product-ids="selectedProductIds"
          :max-items="6"
          @add-product="handleRecommendationAdd"
        />
      </div>

      <!-- Notes -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >หมายเหตุ (ถ้ามี)</label
        >
        <textarea
          v-model="form.notes"
          rows="2"
          placeholder="เช่น ฝากไว้หน้าบ้าน"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007f3e] focus:border-transparent resize-none"
        />
      </div>
    </div>

    <!-- Save Button -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-[480px] mx-auto"
    >
      <button
        @click="handleSave"
        :disabled="saving || selectedItems.length === 0"
        class="w-full py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <LoadingSpinner v-if="saving" class="w-5 h-5" />
        <span>{{
          saving
            ? "กำลังบันทึก..."
            : isEdit
            ? "บันทึกการเปลี่ยนแปลง"
            : "สร้างรายการ"
        }}</span>
      </button>
    </div>

    <!-- Product Picker Modal -->
    <Transition name="slide-up">
      <div
        v-if="showProductPicker"
        class="fixed inset-0 bg-black/50 z-50"
        @click.self="showProductPicker = false"
      >
        <div
          class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col max-w-[480px] mx-auto"
        >
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between">
            <h3 class="font-bold text-lg">เลือกสินค้า</h3>
            <button @click="showProductPicker = false">
              <X class="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <!-- Search -->
          <div class="p-4 border-b">
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาสินค้า..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <!-- Products Grid -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                @click="addProduct(product)"
                class="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors relative"
              >
                <!-- Selected Badge -->
                <div
                  v-if="isSelected(product.id)"
                  class="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {{ getSelectedQuantity(product.id) }}
                </div>

                <LazyImage
                  :src="product.image"
                  :alt="product.name"
                  class="w-full aspect-square rounded-lg mb-2"
                />
                <p class="text-sm font-medium text-gray-800 line-clamp-1">
                  {{ product.name }}
                </p>
                <p class="text-sm text-[#007f3e] font-bold">
                  ฿{{ product.price }}
                </p>
              </div>
            </div>
          </div>

          <!-- Done Button -->
          <div class="p-4 border-t">
            <button
              @click="showProductPicker = false"
              class="w-full py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Check class="w-5 h-5" />
              เสร็จสิ้น ({{ selectedItems.length }} รายการ)
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}
.slide-up-enter-from > div,
.slide-up-leave-to > div {
  transform: translateY(100%);
}
</style>
