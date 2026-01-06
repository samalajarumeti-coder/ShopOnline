<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAdminStore } from "../../stores/admin";
import { supabase } from "../../lib/supabase";
import MultiImageUpload from "../../components/MultiImageUpload.vue";
import { Plus, Pencil, Trash2, X, Loader2, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Zap, Package } from "lucide-vue-next";

const adminStore = useAdminStore();
const showModal = ref(false);
const editingProduct = ref(null);
const saving = ref(false);
const errorMsg = ref("");
const searchQuery = ref("");
const filterCategory = ref("");
const filterStatus = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(20);

const form = ref({
  name: "",
  name_en: "",
  description: "",
  price: "",
  original_price: "",
  images: [],
  category_id: "",
  is_flash_sale: false,
  is_active: true,
  stock: 100
});

const filteredProducts = computed(() => {
  let result = [...adminStore.products];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q));
  }
  if (filterCategory.value) result = result.filter(p => p.category_id === filterCategory.value);
  if (filterStatus.value !== "") result = result.filter(p => p.is_active === (filterStatus.value === "active"));
  return result;
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredProducts.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value));

watch([searchQuery, filterCategory, filterStatus], () => { currentPage.value = 1; });

onMounted(async () => {
  await Promise.all([adminStore.fetchAllProducts(), adminStore.fetchAllCategories()]);
});

function openCreate() {
  editingProduct.value = null;
  errorMsg.value = "";
  form.value = { name: "", name_en: "", description: "", price: "", original_price: "", images: [], category_id: "", is_flash_sale: false, is_active: true, stock: 100 };
  showModal.value = true;
}

function openEdit(product) {
  editingProduct.value = product;
  errorMsg.value = "";
  let productImages = [];
  if (product.images && product.images.length > 0) productImages = [...product.images];
  else if (product.image) productImages = [product.image];
  form.value = {
    name: product.name || "",
    name_en: product.name_en || "",
    description: product.description || "",
    price: product.price || "",
    original_price: product.original_price || "",
    images: productImages,
    category_id: product.category_id || "",
    is_flash_sale: product.is_flash_sale || false,
    is_active: product.is_active !== false,
    stock: product.stock || 100
  };
  showModal.value = true;
}

async function toggleProductStatus(product, field) {
  try {
    await adminStore.updateProduct(product.id, { [field]: !product[field] });
  } catch (err) {
    alert("อัพเดทไม่สำเร็จ: " + err.message);
  }
}

async function saveProduct() {
  saving.value = true;
  errorMsg.value = "";
  try {
    const data = {
      name: form.value.name,
      name_en: form.value.name_en || null,
      description: form.value.description || null,
      price: Number(form.value.price),
      original_price: form.value.original_price ? Number(form.value.original_price) : null,
      image: form.value.images.length > 0 ? form.value.images[0] : null,
      images: form.value.images.length > 0 ? form.value.images : null,
      category_id: form.value.category_id || null,
      is_flash_sale: form.value.is_flash_sale,
      is_active: form.value.is_active,
      stock: Number(form.value.stock) || 100
    };
    if (editingProduct.value) await adminStore.updateProduct(editingProduct.value.id, data);
    else await adminStore.createProduct(data);
    showModal.value = false;
  } catch (err) {
    errorMsg.value = err.message || "เกิดข้อผิดพลาดในการบันทึก";
  } finally {
    saving.value = false;
  }
}

async function deleteProduct(id) {
  if (confirm("ยืนยันการลบสินค้านี้?")) {
    try {
      await adminStore.deleteProduct(id);
    } catch (err) {
      errorMsg.value = "ลบไม่สำเร็จ: " + err.message;
    }
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat("th-TH").format(val);
}

function getCategoryName(categoryId) {
  const cat = adminStore.categories.find(c => c.id === categoryId);
  return cat?.name || "-";
}

function clearFilters() {
  searchQuery.value = "";
  filterCategory.value = "";
  filterStatus.value = "";
}
</script>

<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-bold">จัดการสินค้า</h1>
        <p class="text-sm text-gray-500">ทั้งหมด {{ filteredProducts.length }} รายการ</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
        <Plus class="w-4 h-4" /> เพิ่มสินค้า
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อสินค้า..." class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <select v-model="filterCategory" class="border rounded-lg px-3 py-2 text-sm">
          <option value="">ทุกหมวดหมู่</option>
          <option v-for="cat in adminStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <select v-model="filterStatus" class="border rounded-lg px-3 py-2 text-sm">
          <option value="">ทุกสถานะ</option>
          <option value="active">เปิดขาย</option>
          <option value="inactive">ปิดขาย</option>
        </select>
        <button v-if="searchQuery || filterCategory || filterStatus" @click="clearFilters" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">ล้างตัวกรอง</button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="adminStore.loading" class="p-8 text-center text-gray-500">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />กำลังโหลดข้อมูล...
      </div>
      <div v-else-if="filteredProducts.length === 0" class="p-8 text-center text-gray-500">
        <Package class="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p v-if="adminStore.products.length === 0">ยังไม่มีสินค้า</p>
        <p v-else>ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left">รูป</th>
              <th class="px-4 py-3 text-left">ชื่อสินค้า</th>
              <th class="px-4 py-3 text-left">ราคา</th>
              <th class="px-4 py-3 text-left">หมวดหมู่</th>
              <th class="px-4 py-3 text-center">สถานะ</th>
              <th class="px-4 py-3 text-center">Flash</th>
              <th class="px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="product in paginatedProducts" :key="product.id" class="hover:bg-gray-50">
              <td class="px-4 py-3"><img :src="product.image || '/placeholder.png'" :alt="product.name" class="w-12 h-12 object-cover rounded-lg bg-gray-100" /></td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ product.name }}</p>
                <p class="text-xs text-gray-500">{{ product.name_en || '-' }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-green-600">฿{{ formatCurrency(product.price) }}</p>
                <p v-if="product.original_price" class="text-xs text-gray-400 line-through">฿{{ formatCurrency(product.original_price) }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ getCategoryName(product.category_id) }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="toggleProductStatus(product, 'is_active')" :class="['p-1.5 rounded-lg', product.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400']">
                  <Eye v-if="product.is_active" class="w-4 h-4" /><EyeOff v-else class="w-4 h-4" />
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <button @click="toggleProductStatus(product, 'is_flash_sale')" :class="['p-1.5 rounded-lg', product.is_flash_sale ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400']">
                  <Zap class="w-4 h-4" />
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center gap-1">
                  <button @click="openEdit(product)" class="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"><Pencil class="w-4 h-4" /></button>
                  <button @click="deleteProduct(product.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <div class="text-sm text-gray-600">หน้า {{ currentPage }} / {{ totalPages }}</div>
        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1" class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"><ChevronLeft class="w-4 h-4" /></button>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h3 class="text-lg font-semibold">{{ editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่" }}</h3>
          <button @click="showModal = false" class="p-1 hover:bg-gray-100 rounded-lg"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="saveProduct" class="p-4 space-y-4">
          <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ errorMsg }}</div>
          
          <div>
            <label class="block text-sm font-medium mb-2">รูปภาพสินค้า <span class="text-xs text-gray-500 font-normal ml-2">(อัพโหลดจากอุปกรณ์)</span></label>
            <MultiImageUpload v-model="form.images" :max-images="5" />
            <p class="text-xs text-gray-500 mt-2">รองรับไฟล์ JPG, PNG, WebP (สูงสุด 5MB ต่อรูป)</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium mb-1">ชื่อสินค้า (ไทย) *</label>
              <input v-model="form.name" required placeholder="เช่น น้ำดื่ม" class="w-full border rounded-lg px-3 py-2" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium mb-1">ชื่อสินค้า (อังกฤษ)</label>
              <input v-model="form.name_en" placeholder="e.g. Drinking Water" class="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">รายละเอียดสินค้า</label>
            <textarea v-model="form.description" rows="3" placeholder="รายละเอียดสินค้า..." class="w-full border rounded-lg px-3 py-2"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">ราคาขาย *</label>
              <input v-model="form.price" type="number" step="0.01" required placeholder="0.00" class="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ราคาเดิม</label>
              <input v-model="form.original_price" type="number" step="0.01" placeholder="0.00" class="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">หมวดหมู่</label>
              <select v-model="form.category_id" class="w-full border rounded-lg px-3 py-2">
                <option value="">-- เลือกหมวดหมู่ --</option>
                <option v-for="cat in adminStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">จำนวนสต็อก</label>
              <input v-model="form.stock" type="number" min="0" placeholder="100" class="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div class="space-y-3">
            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input v-model="form.is_active" type="checkbox" class="w-5 h-5 rounded text-green-600" />
              <div><span class="text-sm font-medium">เปิดขาย</span><p class="text-xs text-gray-500">สินค้าจะแสดงในหน้าร้าน</p></div>
            </label>
            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input v-model="form.is_flash_sale" type="checkbox" class="w-5 h-5 rounded text-red-600" />
              <div><span class="text-sm font-medium">Flash Sale</span><p class="text-xs text-gray-500">แสดงในโซน Flash Sale</p></div>
            </label>
          </div>

          <div class="flex gap-3 pt-4 border-t">
            <button type="button" @click="showModal = false" :disabled="saving" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">ยกเลิก</button>
            <button type="submit" :disabled="saving" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />{{ saving ? "กำลังบันทึก..." : "บันทึก" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
