<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAddressesStore } from "../stores/addresses";
import {
  ChevronLeft,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const addressesStore = useAddressesStore();

const loading = ref(false);
const deletingId = ref(null);

const loadAddresses = async () => {
  loading.value = true;
  try {
    await addressesStore.fetchAddresses();
  } catch (error) {
    console.error("Error loading addresses:", error);
  } finally {
    loading.value = false;
  }
};

const handleSetDefault = async (addressId) => {
  try {
    await addressesStore.setDefaultAddress(addressId);
  } catch (error) {
    console.error("Error setting default:", error);
    alert("เกิดข้อผิดพลาดในการตั้งค่าที่อยู่หลัก");
  }
};

const handleDelete = async (addressId) => {
  if (!confirm("คุณต้องการลบที่อยู่นี้ใช่หรือไม่?")) return;

  deletingId.value = addressId;
  try {
    await addressesStore.deleteAddress(addressId);
  } catch (error) {
    console.error("Error deleting address:", error);
    alert("เกิดข้อผิดพลาดในการลบที่อยู่");
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  loadAddresses();
});
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6] pb-20">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3">
          <button
            @click="router.back()"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft class="w-6 h-6 text-gray-700" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900">ที่อยู่จัดส่ง</h1>
        </div>
        <button
          @click="router.push('/customer/add-address')"
          class="flex items-center gap-2 bg-[#007f3e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#006633] transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>เพิ่มที่อยู่</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="addressesStore.addresses.length === 0"
      class="flex flex-col items-center justify-center py-20 px-4"
    >
      <div
        class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <MapPin class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        ยังไม่มีที่อยู่จัดส่ง
      </h3>
      <p class="text-gray-500 text-center mb-6">
        เพิ่มที่อยู่เพื่อให้การจัดส่งสินค้าสะดวกยิ่งขึ้น
      </p>
      <button
        @click="router.push('/customer/add-address')"
        class="flex items-center gap-2 bg-[#007f3e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
      >
        <Plus class="w-5 h-5" />
        <span>เพิ่มที่อยู่แรก</span>
      </button>
    </div>

    <!-- Addresses List -->
    <div v-else class="p-4 space-y-3">
      <div
        v-for="address in addressesStore.addresses"
        :key="address.id"
        class="bg-white rounded-xl p-4 shadow-sm"
        :class="{ 'ring-2 ring-[#007f3e]': address.is_default }"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <MapPin class="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <h3 class="font-semibold text-gray-900">{{ address.label }}</h3>
              <span
                v-if="address.is_default"
                class="inline-flex items-center gap-1 text-xs text-[#007f3e] font-medium mt-1"
              >
                <CheckCircle class="w-3 h-3" />
                ที่อยู่หลัก
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="router.push(`/customer/edit-address/${address.id}`)"
              class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Edit2 class="w-4 h-4 text-gray-600" />
            </button>
            <button
              @click="handleDelete(address.id)"
              :disabled="deletingId === address.id"
              class="p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            >
              <Loader2
                v-if="deletingId === address.id"
                class="w-4 h-4 text-red-500 animate-spin"
              />
              <Trash2 v-else class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <!-- Address Details -->
        <div class="text-sm text-gray-600 space-y-1 mb-3">
          <p>{{ address.recipient_name }} | {{ address.phone }}</p>
          <p>{{ address.address }}</p>
          <p>
            {{ address.sub_district }} {{ address.district }}
            {{ address.province }} {{ address.postal_code }}
          </p>
        </div>

        <!-- Set Default Button -->
        <button
          v-if="!address.is_default"
          @click="handleSetDefault(address.id)"
          class="w-full py-2 border border-[#007f3e] text-[#007f3e] rounded-lg font-medium hover:bg-[#007f3e] hover:text-white transition-colors"
        >
          ตั้งเป็นที่อยู่หลัก
        </button>
      </div>
    </div>
  </div>
</template>
