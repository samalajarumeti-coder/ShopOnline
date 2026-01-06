<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Save,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  full_name: "",
  phone: "",
  birth_date: "",
});

const loading = ref(false);
const error = ref("");
const success = ref(false);

const loadProfile = () => {
  if (authStore.profile) {
    form.value = {
      full_name: authStore.profile.full_name || "",
      phone: authStore.profile.phone || "",
      birth_date: authStore.profile.birth_date || "",
    };
  }
};

const handleSubmit = async () => {
  if (!form.value.full_name.trim()) {
    error.value = "กรุณากรอกชื่อ-นามสกุล";
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    await authStore.updateProfile(form.value);
    success.value = true;
    setTimeout(() => {
      router.back();
    }, 1500);
  } catch (e) {
    console.error("Update profile error:", e);
    error.value = "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="min-h-screen bg-[#f3f4f6]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center gap-3 px-4 py-4">
        <button
          @click="router.back()"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft class="w-6 h-6 text-gray-700" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900">แก้ไขโปรไฟล์</h1>
      </div>
    </div>

    <!-- Form -->
    <div class="p-4">
      <!-- Success Message -->
      <div
        v-if="success"
        class="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl"
      >
        ✓ บันทึกข้อมูลเรียบร้อยแล้ว
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
      >
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Full Name -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <label class="flex items-center gap-3 text-gray-700 mb-3">
            <User class="w-5 h-5 text-gray-400" />
            <span class="font-medium">ชื่อ-นามสกุล</span>
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.full_name"
            type="text"
            placeholder="กรอกชื่อ-นามสกุล"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
            required
          />
        </div>

        <!-- Email (Read-only) -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <label class="flex items-center gap-3 text-gray-700 mb-3">
            <Mail class="w-5 h-5 text-gray-400" />
            <span class="font-medium">อีเมล</span>
          </label>
          <input
            :value="authStore.user?.email"
            type="email"
            disabled
            class="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
          />
          <p class="text-xs text-gray-500 mt-2">ไม่สามารถเปลี่ยนอีเมลได้</p>
        </div>

        <!-- Phone -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <label class="flex items-center gap-3 text-gray-700 mb-3">
            <Phone class="w-5 h-5 text-gray-400" />
            <span class="font-medium">เบอร์โทรศัพท์</span>
          </label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="0XX-XXX-XXXX"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
          />
        </div>

        <!-- Birth Date -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <label class="flex items-center gap-3 text-gray-700 mb-3">
            <Calendar class="w-5 h-5 text-gray-400" />
            <span class="font-medium">วันเกิด</span>
          </label>
          <input
            v-model="form.birth_date"
            type="date"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
          />
          <p class="text-xs text-gray-500 mt-2">
            รับส่วนลดพิเศษในวันเกิดของคุณ
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#007f3e] text-white py-4 rounded-xl font-medium hover:bg-[#006633] active:bg-[#005a2d] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <Save v-else class="w-5 h-5" />
          <span>{{ loading ? "กำลังบันทึก..." : "บันทึกข้อมูล" }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
