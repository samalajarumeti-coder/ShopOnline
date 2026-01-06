/* Path: /login */
<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = "กรุณากรอกข้อมูลให้ครบ";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await authStore.signIn(email.value, password.value);
    // Redirect to original page or profile
    const redirect = route.query.redirect || "/customer/profile";
    router.push(redirect);
  } catch (e) {
    error.value =
      e.message === "Invalid login credentials"
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        : e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <!-- Header -->
    <div class="bg-[#007f3e] px-4 py-6 text-white">
      <button @click="router.back()" class="mb-4">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <h1 class="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <p class="text-sm opacity-80 mt-1">ยินดีต้อนรับกลับมา!</p>
    </div>

    <div class="px-4 py-6">
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
              @keyup.enter="handleLogin"
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
              placeholder="••••••••"
              class="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
              @keyup.enter="handleLogin"
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

        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full bg-[#007f3e] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
        >
          {{ loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ" }}
        </button>
      </div>

      <!-- Register Link -->
      <p class="text-center mt-6 text-gray-600">
        ยังไม่มีบัญชี?
        <router-link
          :to="{ path: '/register', query: route.query }"
          class="text-[#007f3e] font-medium"
        >
          สมัครสมาชิก
        </router-link>
      </p>
    </div>
  </div>
</template>
