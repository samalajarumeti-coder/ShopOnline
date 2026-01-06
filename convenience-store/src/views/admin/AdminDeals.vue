<script setup>
import { ref, computed, onMounted } from "vue";
import { useAdminStore } from "../../stores/admin";
import { supabase } from "../../lib/supabase";
import {
  Gift,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  Percent,
  DollarSign,
  Tag,
  Calendar,
  Package,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-vue-next";

const adminStore = useAdminStore();
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const showModal = ref(false);
const editingDeal = ref(null);
const activeTab = ref("active");

// Deals data
const deals = ref([]);

// Form data
const form = ref({
  name: "",
  name_en: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_quantity: 1,
  is_active: true,
  start_date: "",
  end_date: "",
  product_ids: [],
});

// Computed
const filteredDeals = computed(() => {
  let result = deals.value;

  // Filter by tab
  if (activeTab.value === "active") {
    result = result.filter((d) => d.is_active);
  } else if (activeTab.value === "inactive") {
    result = result.filter((d) => !d.is_active);
  } else if (activeTab.value === "scheduled") {
    const now = new Date();
    result = result.filter((d) => d.start_date && new Date(d.start_date) > now);
  }

  // Filter by search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.name_en?.toLowerCase().includes(q)
    );
  }

  return result;
});

const availableProducts = computed(() => {
  return adminStore.products.filter((p) => p.is_active).slice(0, 50);
});

const selectedProducts = computed(() => {
  return adminStore.products.filter((p) =>
    form.value.product_ids.includes(p.id)
  );
});

// Methods
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchDeals(), adminStore.fetchAllProducts()]);
  loading.value = false;
});

async function fetchDeals() {
  try {
    const { data, error } = await supabase
      .from("product_bundles")
      .select(
        `
        *,
        bundle_products (
          quantity,
          is_required,
          product_id,
          products:product_id (id, name, name_en, price, image)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    deals.value = data || [];
  } catch (err) {
    console.error("Failed to fetch deals:", err);
    deals.value = [];
  }
}

function openCreateModal() {
  editingDeal.value = null;
  form.value = {
    name: "",
    name_en: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_quantity: 1,
    is_active: true,
    start_date: "",
    end_date: "",
    product_ids: [],
  };
  showModal.value = true;
}

function openEditModal(deal) {
  editingDeal.value = deal;
  form.value = {
    name: deal.name || "",
    name_en: deal.name_en || "",
    description: deal.description || "",
    discount_type: deal.discount_type || "percentage",
    discount_value: deal.discount_value || 10,
    min_quantity: deal.min_quantity || 1,
    is_active: deal.is_active ?? true,
    start_date: deal.start_date ? deal.start_date.slice(0, 16) : "",
    end_date: deal.end_date ? deal.end_date.slice(0, 16) : "",
    product_ids: deal.bundle_products?.map((bp) => bp.product_id) || [],
  };
  showModal.value = true;
}

async function saveDeal() {
  if (!form.value.name || form.value.product_ids.length < 2) {
    alert("กรุณากรอกชื่อ Deal และเลือกสินค้าอย่างน้อย 2 รายการ");
    return;
  }

  saving.value = true;
  try {
    const dealData = {
      name: form.value.name,
      name_en: form.value.name_en || null,
      description: form.value.description || null,
      discount_type: form.value.discount_type,
      discount_value: form.value.discount_value,
      min_quantity: form.value.min_quantity,
      is_active: form.value.is_active,
      start_date: form.value.start_date || null,
      end_date: form.value.end_date || null,
    };

    let dealId;

    if (editingDeal.value) {
      // Update existing deal
      const { error } = await supabase
        .from("product_bundles")
        .update(dealData)
        .eq("id", editingDeal.value.id);

      if (error) throw error;
      dealId = editingDeal.value.id;

      // Delete existing bundle products
      await supabase.from("bundle_products").delete().eq("bundle_id", dealId);
    } else {
      // Create new deal
      const { data, error } = await supabase
        .from("product_bundles")
        .insert(dealData)
        .select()
        .single();

      if (error) throw error;
      dealId = data.id;
    }

    // Insert bundle products
    const bundleProducts = form.value.product_ids.map((productId) => ({
      bundle_id: dealId,
      product_id: productId,
      quantity: 1,
      is_required: true,
    }));

    const { error: bpError } = await supabase
      .from("bundle_products")
      .insert(bundleProducts);

    if (bpError) throw bpError;

    await fetchDeals();
    showModal.value = false;
  } catch (err) {
    alert("บันทึกไม่สำเร็จ: " + err.message);
  } finally {
    saving.value = false;
  }
}

async function toggleDealStatus(deal) {
  try {
    const { error } = await supabase
      .from("product_bundles")
      .update({ is_active: !deal.is_active })
      .eq("id", deal.id);

    if (error) throw error;
    deal.is_active = !deal.is_active;
  } catch (err) {
    alert("อัพเดทไม่สำเร็จ: " + err.message);
  }
}

async function deleteDeal(deal) {
  if (!confirm(`ยืนยันการลบ Deal "${deal.name}"?`)) return;

  try {
    const { error } = await supabase
      .from("product_bundles")
      .delete()
      .eq("id", deal.id);

    if (error) throw error;
    deals.value = deals.value.filter((d) => d.id !== deal.id);
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
  }
}

function toggleProduct(productId) {
  const idx = form.value.product_ids.indexOf(productId);
  if (idx === -1) {
    form.value.product_ids.push(productId);
  } else {
    form.value.product_ids.splice(idx, 1);
  }
}

// Helpers
const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val);
const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "-";

function getDiscountLabel(deal) {
  if (deal.discount_type === "percentage") return `-${deal.discount_value}%`;
  if (deal.discount_type === "fixed")
    return `-฿${formatCurrency(deal.discount_value)}`;
  if (deal.discount_type === "special_price")
    return `฿${formatCurrency(deal.discount_value)}`;
  return "";
}

function calculateOriginalPrice(deal) {
  if (!deal.bundle_products) return 0;
  return deal.bundle_products.reduce(
    (sum, bp) => sum + (bp.products?.price || 0) * bp.quantity,
    0
  );
}

function calculateDealPrice(deal) {
  const original = calculateOriginalPrice(deal);
  if (deal.discount_type === "percentage")
    return original * (1 - deal.discount_value / 100);
  if (deal.discount_type === "fixed")
    return Math.max(0, original - deal.discount_value);
  if (deal.discount_type === "special_price") return deal.discount_value;
  return original;
}

function getDealStatus(deal) {
  const now = new Date();
  if (!deal.is_active)
    return { label: "ปิดใช้งาน", color: "bg-gray-100 text-gray-600" };
  if (deal.start_date && new Date(deal.start_date) > now)
    return { label: "รอเริ่ม", color: "bg-yellow-100 text-yellow-700" };
  if (deal.end_date && new Date(deal.end_date) < now)
    return { label: "หมดอายุ", color: "bg-red-100 text-red-600" };
  return { label: "ใช้งานอยู่", color: "bg-green-100 text-green-700" };
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Gift class="w-6 h-6 text-green-500" />
          จัดการ Deal / Bundle
        </h1>
        <p class="text-sm text-gray-500">{{ deals.length }} รายการทั้งหมด</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        <Plus class="w-4 h-4" />
        สร้าง Deal ใหม่
      </button>
    </div>

    <!-- Search & Tabs -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหา Deal..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="activeTab = 'all'"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm',
              activeTab === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            ทั้งหมด
          </button>
          <button
            @click="activeTab = 'active'"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm',
              activeTab === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            ใช้งานอยู่
          </button>
          <button
            @click="activeTab = 'scheduled'"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm',
              activeTab === 'scheduled'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            รอเริ่ม
          </button>
          <button
            @click="activeTab = 'inactive'"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm',
              activeTab === 'inactive'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            ปิดใช้งาน
          </button>
        </div>
      </div>
    </div>

    <!-- Deals List -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
        กำลังโหลด...
      </div>

      <div
        v-else-if="filteredDeals.length === 0"
        class="p-8 text-center text-gray-500"
      >
        <Gift class="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>ยังไม่มี Deal</p>
        <button
          @click="openCreateModal"
          class="mt-3 text-green-600 hover:text-green-700 font-medium"
        >
          + สร้าง Deal ใหม่
        </button>
      </div>

      <div v-else class="divide-y">
        <div
          v-for="deal in filteredDeals"
          :key="deal.id"
          class="p-4 hover:bg-gray-50"
        >
          <div class="flex items-start gap-4">
            <!-- Deal Icon -->
            <div
              class="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white shrink-0"
            >
              <Gift class="w-8 h-8" />
            </div>

            <!-- Deal Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-900">{{ deal.name }}</h3>
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full',
                    getDealStatus(deal).color,
                  ]"
                >
                  {{ getDealStatus(deal).label }}
                </span>
                <span
                  class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium"
                >
                  {{ getDiscountLabel(deal) }}
                </span>
              </div>

              <p v-if="deal.name_en" class="text-sm text-gray-500">
                {{ deal.name_en }}
              </p>
              <p v-if="deal.description" class="text-sm text-gray-600 mt-1">
                {{ deal.description }}
              </p>

              <!-- Products in deal -->
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <div
                  v-for="bp in deal.bundle_products?.slice(0, 4)"
                  :key="bp.product_id"
                  class="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1"
                >
                  <img
                    :src="bp.products?.image || '/placeholder-product.svg'"
                    class="w-5 h-5 rounded-full object-cover"
                  />
                  <span class="text-xs text-gray-600 truncate max-w-[80px]">{{
                    bp.products?.name
                  }}</span>
                </div>
                <span
                  v-if="deal.bundle_products?.length > 4"
                  class="text-xs text-gray-500"
                >
                  +{{ deal.bundle_products.length - 4 }} อื่นๆ
                </span>
              </div>

              <!-- Price Info -->
              <div class="flex items-center gap-3 mt-2 text-sm">
                <span class="text-gray-400 line-through"
                  >฿{{ formatCurrency(calculateOriginalPrice(deal)) }}</span
                >
                <span class="text-green-600 font-bold"
                  >฿{{ formatCurrency(calculateDealPrice(deal)) }}</span
                >
                <span
                  v-if="deal.start_date || deal.end_date"
                  class="text-gray-500 flex items-center gap-1"
                >
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(deal.start_date) }} -
                  {{ formatDate(deal.end_date) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="toggleDealStatus(deal)"
                :class="[
                  'p-2 rounded-lg',
                  deal.is_active
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100',
                ]"
                :title="deal.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
              >
                <Eye v-if="deal.is_active" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
              <button
                @click="openEditModal(deal)"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit class="w-5 h-5" />
              </button>
              <button
                @click="deleteDeal(deal)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-semibold">
            <Gift class="w-5 h-5 inline mr-2 text-green-500" />
            {{ editingDeal ? "แก้ไข Deal" : "สร้าง Deal ใหม่" }}
          </h3>
          <button
            @click="showModal = false"
            class="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2"
                >ชื่อ Deal (ไทย) *</label
              >
              <input
                v-model="form.name"
                type="text"
                placeholder="เช่น ซื้อคู่คุ้มกว่า"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2"
                >ชื่อ Deal (อังกฤษ)</label
              >
              <input
                v-model="form.name_en"
                type="text"
                placeholder="e.g. Buy Together Save More"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">รายละเอียด</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="อธิบาย Deal นี้..."
              class="w-full border rounded-lg px-3 py-2"
            ></textarea>
          </div>

          <!-- Discount Settings -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium mb-3 flex items-center gap-2">
              <Tag class="w-4 h-4 text-green-500" />
              ตั้งค่าส่วนลด
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2"
                  >ประเภทส่วนลด</label
                >
                <select
                  v-model="form.discount_type"
                  class="w-full border rounded-lg px-3 py-2"
                >
                  <option value="percentage">เปอร์เซ็นต์ (%)</option>
                  <option value="fixed">ลดราคาคงที่ (฿)</option>
                  <option value="special_price">ราคาพิเศษ (฿)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  {{
                    form.discount_type === "percentage"
                      ? "ส่วนลด (%)"
                      : "จำนวนเงิน (฿)"
                  }}
                </label>
                <input
                  v-model.number="form.discount_value"
                  type="number"
                  min="0"
                  :max="form.discount_type === 'percentage' ? 100 : undefined"
                  class="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2"
                  >จำนวนขั้นต่ำ</label
                >
                <input
                  v-model.number="form.min_quantity"
                  type="number"
                  min="1"
                  class="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <!-- Schedule -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                <Calendar class="w-4 h-4 inline mr-1" />
                วันเริ่มต้น (ไม่บังคับ)
              </label>
              <input
                v-model="form.start_date"
                type="datetime-local"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                <Calendar class="w-4 h-4 inline mr-1" />
                วันสิ้นสุด (ไม่บังคับ)
              </label>
              <input
                v-model="form.end_date"
                type="datetime-local"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <!-- Status -->
          <label
            class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              v-model="form.is_active"
              type="checkbox"
              class="w-5 h-5 rounded text-green-600"
            />
            <span class="font-medium">เปิดใช้งาน Deal นี้</span>
          </label>

          <!-- Product Selection -->
          <div>
            <label class="block text-sm font-medium mb-2">
              <Package class="w-4 h-4 inline mr-1" />
              เลือกสินค้าใน Deal * ({{ form.product_ids.length }} รายการ)
            </label>

            <!-- Selected Products -->
            <div
              v-if="selectedProducts.length > 0"
              class="flex flex-wrap gap-2 mb-3"
            >
              <div
                v-for="product in selectedProducts"
                :key="product.id"
                class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1"
              >
                <img
                  :src="product.image || '/placeholder-product.svg'"
                  class="w-6 h-6 rounded-full object-cover"
                />
                <span class="text-sm">{{ product.name }}</span>
                <button
                  @click="toggleProduct(product.id)"
                  class="text-green-600 hover:text-green-800"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Product List -->
            <div class="border rounded-lg max-h-48 overflow-y-auto">
              <div
                v-for="product in availableProducts"
                :key="product.id"
                @click="toggleProduct(product.id)"
                :class="[
                  'flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50',
                  form.product_ids.includes(product.id) ? 'bg-green-50' : '',
                ]"
              >
                <input
                  type="checkbox"
                  :checked="form.product_ids.includes(product.id)"
                  class="w-4 h-4 rounded text-green-600"
                  @click.stop
                />
                <img
                  :src="product.image || '/placeholder-product.svg'"
                  class="w-10 h-10 object-cover rounded"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">{{ product.name_en }}</p>
                </div>
                <span class="text-sm text-green-600 font-medium"
                  >฿{{ formatCurrency(product.price) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div
            v-if="selectedProducts.length >= 2"
            class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
          >
            <h4 class="font-medium text-green-800 mb-2">ตัวอย่าง Deal</h4>
            <div class="flex items-center gap-4">
              <div class="flex -space-x-2">
                <img
                  v-for="product in selectedProducts.slice(0, 3)"
                  :key="product.id"
                  :src="product.image || '/placeholder-product.svg'"
                  class="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
              </div>
              <div>
                <p class="text-sm text-gray-600">
                  ราคาปกติ:
                  <span class="line-through"
                    >฿{{
                      formatCurrency(
                        selectedProducts.reduce((sum, p) => sum + p.price, 0)
                      )
                    }}</span
                  >
                </p>
                <p class="text-lg font-bold text-green-600">
                  ราคา Deal: ฿{{
                    formatCurrency(
                      form.discount_type === "percentage"
                        ? selectedProducts.reduce(
                            (sum, p) => sum + p.price,
                            0
                          ) *
                            (1 - form.discount_value / 100)
                        : form.discount_type === "fixed"
                        ? Math.max(
                            0,
                            selectedProducts.reduce(
                              (sum, p) => sum + p.price,
                              0
                            ) - form.discount_value
                          )
                        : form.discount_value
                    )
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex gap-3 p-4 border-t">
          <button
            @click="showModal = false"
            class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            @click="saveDeal"
            :disabled="saving || !form.name || form.product_ids.length < 2"
            class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin inline mr-1" />
            {{ editingDeal ? "บันทึก" : "สร้าง Deal" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
