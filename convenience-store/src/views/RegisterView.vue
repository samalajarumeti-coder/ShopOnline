/* Path: /register */
<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref(false);

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value) {
    error.value = "กรุณากรอกข้อมูลให้ครบ";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "รหัสผ่านไม่ตรงกัน";
    return;
  }

  if (password.value.length < 6) {
    error.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await authStore.signUp(email.value, password.value, fullName.value);
    // สมัครสำเร็จ - redirect ไปหน้าที่ต้องการทันที (ไม่ต้อง login ใหม่)
    const redirectTo = route.query.redirect || "/customer";
    router.push(redirectTo);
  } catch (e) {
    // จัดการ error ต่างๆ
    const msg = e.message?.toLowerCase() || "";
    if (msg.includes("already registered") || msg.includes("already exists")) {
      error.value = "อีเมลนี้ถูกใช้งานแล้ว";
    } else if (msg.includes("invalid") && msg.includes("email")) {
      error.value = "กรุณาใช้อีเมลจริงที่สามารถรับข้อความได้";
    } else if (msg.includes("password")) {
      error.value = "รหัสผ่านไม่ถูกต้อง กรุณาใช้อย่างน้อย 6 ตัวอักษร";
    } else {
      error.value = e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
    }
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push({ path: "/customer/login", query: route.query });
};
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <!-- Header -->
    <div class="bg-[#007f3e] px-4 py-6 text-white">
      <button @click="router.back()" class="mb-4">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <h1 class="text-2xl font-bold">สมัครสมาชิก</h1>
      <p class="text-sm opacity-80 mt-1">สร้างบัญชีเพื่อรับสิทธิพิเศษ</p>
    </div>

    <div class="px-4 py-6">
      <!-- Success Message -->
      <div
        v-if="success"
        class="bg-green-100 text-green-700 px-4 py-6 rounded-xl text-center"
      >
        <p class="font-bold text-lg mb-2">สมัครสมาชิกสำเร็จ!</p>
        <p class="text-sm mb-4">กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี</p>
        <button @click="goToLogin" class="text-[#007f3e] font-medium">
          ไปหน้าเข้าสู่ระบบ
        </button>
      </div>

      <template v-else>
        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-100 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">ชื่อ-นามสกุล</label>
            <div class="relative">
              <User
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="fullName"
                type="text"
                placeholder="ชื่อ นามสกุล"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1 block">อีเมล</label>
            <div class="relative">
              <Mail
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="email"
                type="email"
                placeholder="example@email.com"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1 block">รหัสผ่าน</label>
            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                class="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1 block"
              >ยืนยันรหัสผ่าน</label
            >
            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
              />
            </div>
          </div>

          <button
            @click="handleRegister"
            :disabled="loading"
            class="w-full bg-[#007f3e] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {{ loading ? "กำลังสมัคร..." : "สมัครสมาชิก" }}
          </button>
        </div>

        <!-- Login Link -->
        <p class="text-center mt-6 text-gray-600">
          มีบัญชีอยู่แล้ว?
          <router-link
            :to="{ path: '/login', query: route.query }"
            class="text-[#007f3e] font-medium"
          >
            เข้าสู่ระบบ
          </router-link>
        </p>
      </template>
    </div>
  </div>
</template>
