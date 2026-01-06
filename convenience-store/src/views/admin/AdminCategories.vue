<script setup>
import { ref, onMounted } from "vue";
import { useAdminStore } from "../../stores/admin";
import { Plus, Pencil, Trash2, X, FolderTree } from "lucide-vue-next";

const adminStore = useAdminStore();
const showModal = ref(false);
const editingCategory = ref(null);
const form = ref({
  id: "",
  name: "",
  name_en: "",
  icon: "package",
  sort_order: 0,
});

onMounted(() => adminStore.fetchAllCategories());

function openCreate() {
  editingCategory.value = null;
  form.value = {
    id: "",
    name: "",
    name_en: "",
    icon: "package",
    sort_order: 0,
  };
  showModal.value = true;
}

function openEdit(category) {
  editingCategory.value = category;
  form.value = { ...category };
  showModal.value = true;
}

async function saveCategory() {
  if (editingCategory.value) {
    await adminStore.updateCategory(editingCategory.value.id, form.value);
  } else {
    await adminStore.createCategory(form.value);
  }
  showModal.value = false;
}

async function deleteCategory(id) {
  if (confirm("ยืนยันการลบหมวดหมู่นี้?")) await adminStore.deleteCategory(id);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">จัดการหมวดหมู่</h1>
      <button
        @click="openCreate"
        class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        <Plus class="w-5 h-5" /> เพิ่มหมวดหมู่
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="cat in adminStore.categories"
        :key="cat.id"
        class="bg-white rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
          >
            <FolderTree class="w-5 h-5 text-green-600" />
          </div>
          <div class="flex-1">
            <p class="font-medium">{{ cat.name }}</p>
            <p class="text-sm text-gray-500">{{ cat.name_en }}</p>
          </div>
          <div class="flex gap-1">
            <button
              @click="openEdit(cat)"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="deleteCategory(cat.id)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-md">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-semibold">
            {{ editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่" }}
          </h3>
          <button @click="showModal = false"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="saveCategory" class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">รหัส (ID)</label>
            <input
              v-model="form.id"
              required
              :disabled="!!editingCategory"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">ชื่อ (ไทย)</label>
            <input
              v-model="form.name"
              required
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">ชื่อ (อังกฤษ)</label>
            <input
              v-model="form.name_en"
              required
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1"
                >ไอคอน (ชื่อ icon)</label
              >
              <input
                v-model="form.icon"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="package, coffee, etc."
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ลำดับ</label>
              <input
                v-model="form.sort_order"
                type="number"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showModal = false"
              class="flex-1 px-4 py-2 border rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
