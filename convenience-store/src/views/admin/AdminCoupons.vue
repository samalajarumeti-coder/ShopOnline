<script setup>
import { ref, onMounted } from "vue";
import { useAdminStore } from "../../stores/admin";
import { Plus, Pencil, Trash2, X } from "lucide-vue-next";

const adminStore = useAdminStore();
const showModal = ref(false);
const editingCoupon = ref(null);
const form = ref({
  code: "",
  description: "",
  discount_type: "fixed",
  discount_value: "",
  min_order: 0,
  max_discount: "",
  usage_limit: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
});

onMounted(() => adminStore.fetchAllCoupons());

function openCreate() {
  editingCoupon.value = null;
  form.value = {
    code: "",
    description: "",
    discount_type: "fixed",
    discount_value: "",
    min_order: 0,
    max_discount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  };
  showModal.value = true;
}

function openEdit(coupon) {
  editingCoupon.value = coupon;
  form.value = {
    ...coupon,
    valid_from: coupon.valid_from?.slice(0, 16) || "",
    valid_until: coupon.valid_until?.slice(0, 16) || "",
  };
  showModal.value = true;
}

async function saveCoupon() {
  const data = {
    ...form.value,
    code: form.value.code.toUpperCase(),
    discount_value: Number(form.value.discount_value),
    min_order: Number(form.value.min_order) || 0,
    max_discount: form.value.max_discount
      ? Number(form.value.max_discount)
      : null,
    usage_limit: form.value.usage_limit ? Number(form.value.usage_limit) : null,
  };
  if (editingCoupon.value) {
    await adminStore.updateCoupon(editingCoupon.value.id, data);
  } else {
    await adminStore.createCoupon(data);
  }
  showModal.value = false;
}

async function deleteCoupon(id) {
  if (confirm("ยืนยันการลบคูปองนี้?")) await adminStore.deleteCoupon(id);
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">จัดการคูปอง</h1>
      <button
        @click="openCreate"
        class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        <Plus class="w-5 h-5" /> เพิ่มคูปอง
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <!-- Loading State -->
      <div v-if="adminStore.loading" class="p-8 text-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>

      <!-- Empty State -->
      <div
        v-else-if="adminStore.coupons.length === 0"
        class="p-8 text-center text-gray-500"
      >
        ยังไม่มีคูปอง กดปุ่ม "เพิ่มคูปอง" เพื่อเริ่มต้น
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                รหัส
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                รายละเอียด
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ส่วนลด
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ใช้แล้ว
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                สถานะ
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="coupon in adminStore.coupons"
              :key="coupon.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-mono font-bold text-green-600">
                {{ coupon.code }}
              </td>
              <td class="px-4 py-3 text-sm">{{ coupon.description || "-" }}</td>
              <td class="px-4 py-3">
                <span class="font-medium">
                  {{
                    coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `฿${coupon.discount_value}`
                  }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">
                {{ coupon.used_count }}/{{ coupon.usage_limit || "∞" }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs',
                    coupon.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600',
                  ]"
                >
                  {{ coupon.is_active ? "ใช้งาน" : "ปิด" }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button
                    @click="openEdit(coupon)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteCoupon(coupon.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-semibold">
            {{ editingCoupon ? "แก้ไขคูปอง" : "เพิ่มคูปองใหม่" }}
          </h3>
          <button @click="showModal = false"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="saveCoupon" class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">รหัสคูปอง</label>
              <input
                v-model="form.code"
                required
                class="w-full border rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ประเภทส่วนลด</label>
              <select
                v-model="form.discount_type"
                class="w-full border rounded-lg px-3 py-2"
              >
                <option value="fixed">จำนวนเงิน (฿)</option>
                <option value="percentage">เปอร์เซ็นต์ (%)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">รายละเอียด</label>
            <input
              v-model="form.description"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">มูลค่าส่วนลด</label>
              <input
                v-model="form.discount_value"
                type="number"
                required
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ขั้นต่ำ</label>
              <input
                v-model="form.min_order"
                type="number"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ลดสูงสุด</label>
              <input
                v-model="form.max_discount"
                type="number"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">เริ่มใช้</label>
              <input
                v-model="form.valid_from"
                type="datetime-local"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">หมดอายุ</label>
              <input
                v-model="form.valid_until"
                type="datetime-local"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">จำกัดการใช้</label>
              <input
                v-model="form.usage_limit"
                type="number"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="ไม่จำกัด"
              />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">เปิดใช้งาน</span>
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
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
