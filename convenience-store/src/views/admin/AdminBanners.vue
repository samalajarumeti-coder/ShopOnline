<script setup>
import { ref, onMounted } from "vue";
import { useAdminStore } from "../../stores/admin";
import { Plus, Pencil, Trash2, X } from "lucide-vue-next";

const adminStore = useAdminStore();
const showModal = ref(false);
const editingBanner = ref(null);
const form = ref({
  image: "",
  title: "",
  subtitle: "",
  link: "",
  is_active: true,
  sort_order: 0,
});

onMounted(() => adminStore.fetchAllBanners());

function openCreate() {
  editingBanner.value = null;
  form.value = {
    image: "",
    title: "",
    subtitle: "",
    link: "",
    is_active: true,
    sort_order: 0,
  };
  showModal.value = true;
}

function openEdit(banner) {
  editingBanner.value = banner;
  form.value = { ...banner };
  showModal.value = true;
}

async function saveBanner() {
  if (editingBanner.value) {
    await adminStore.updateBanner(editingBanner.value.id, form.value);
  } else {
    await adminStore.createBanner(form.value);
  }
  showModal.value = false;
}

async function deleteBanner(id) {
  if (confirm("ยืนยันการลบแบนเนอร์นี้?")) await adminStore.deleteBanner(id);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">จัดการแบนเนอร์</h1>
      <button
        @click="openCreate"
        class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        <Plus class="w-5 h-5" /> เพิ่มแบนเนอร์
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="banner in adminStore.banners"
        :key="banner.id"
        class="bg-white rounded-xl overflow-hidden shadow-sm"
      >
        <img
          :src="banner.image"
          :alt="banner.title"
          class="w-full h-40 object-cover"
        />
        <div class="p-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">{{ banner.title }}</p>
              <p class="text-sm text-gray-500">{{ banner.subtitle }}</p>
            </div>
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs',
                banner.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600',
              ]"
            >
              {{ banner.is_active ? "แสดง" : "ซ่อน" }}
            </span>
          </div>
          <div class="flex gap-2 mt-3">
            <button
              @click="openEdit(banner)"
              class="flex-1 py-2 text-blue-600 border border-blue-600 rounded-lg text-sm"
            >
              แก้ไข
            </button>
            <button
              @click="deleteBanner(banner.id)"
              class="flex-1 py-2 text-red-600 border border-red-600 rounded-lg text-sm"
            >
              ลบ
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
            {{ editingBanner ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์ใหม่" }}
          </h3>
          <button @click="showModal = false"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="saveBanner" class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">URL รูปภาพ</label>
            <input
              v-model="form.image"
              required
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">หัวข้อ</label>
            <input
              v-model="form.title"
              required
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">คำอธิบาย</label>
            <input
              v-model="form.subtitle"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">ลิงก์</label>
            <input
              v-model="form.link"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">ลำดับ</label>
              <input
                v-model="form.sort_order"
                type="number"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">แสดงแบนเนอร์</span>
              </label>
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
