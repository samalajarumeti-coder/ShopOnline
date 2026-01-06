<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Lock,
  Key,
  ShieldAlert,
  Mail,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

// Login mode: 'admin_table' or 'supabase'
const loginMode = ref("admin_table");
const username = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const attempts = ref(0);
const locked = ref(false);
const lockTimer = ref(0);

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 60;

// Fallback admin credentials (when table doesn't exist)
const FALLBACK_ADMINS = [
  { username: "admin", password: "admin1234", displayName: "ผู้ดูแลระบบ" },
  {
    username: "manager",
    password: "manager1234",
    displayName: "ผู้จัดการร้าน",
  },
];

onMounted(async () => {
  // Check if already logged in as admin via Supabase
  if (authStore.isLoggedIn && authStore.isAdmin) {
    router.push("/admin");
  }
});

async function handleLogin() {
  if (locked.value) {
    error.value = `กรุณารอ ${lockTimer.value} วินาที`;
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    if (loginMode.value === "supabase") {
      // Supabase auth login
      await authStore.signIn(email.value, password.value);

      // Wait for profile to load
      await authStore.fetchProfile();

      if (!authStore.isAdmin) {
        await authStore.signOut();
        throw new Error("บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Panel");
      }

      router.push("/admin");
      return;
    }

    // Admin table login
    const { data: adminUser, error: queryError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username.value)
      .eq("is_active", true)
      .single();

    if (!queryError && adminUser) {
      if (adminUser.password_hash !== password.value) {
        throw new Error("รหัสผ่านไม่ถูกต้อง");
      }

      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminUser.id);

      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem(
        "admin_user",
        JSON.stringify({
          id: adminUser.id,
          username: adminUser.username,
          displayName: adminUser.display_name,
        })
      );

      router.push("/admin");
      return;
    }

    // Fallback to hardcoded credentials
    const fallbackUser = FALLBACK_ADMINS.find(
      (u) => u.username === username.value && u.password === password.value
    );

    if (fallbackUser) {
      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem(
        "admin_user",
        JSON.stringify({
          id: 0,
          username: fallbackUser.username,
          displayName: fallbackUser.displayName,
        })
      );
      router.push("/admin");
      return;
    }

    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  } catch (e) {
    attempts.value++;
    if (attempts.value >= MAX_ATTEMPTS) startLockout();
    error.value = e.message || "เข้าสู่ระบบไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

function startLockout() {
  locked.value = true;
  lockTimer.value = LOCK_DURATION;
  const interval = setInterval(() => {
    lockTimer.value--;
    if (lockTimer.value <= 0) {
      locked.value = false;
      attempts.value = 0;
      clearInterval(interval);
    }
  }, 1000);
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4"
        >
          <ShieldCheck class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
        <p class="text-gray-400 mt-1">เฉพาะผู้ดูแลระบบเท่านั้น</p>
      </div>

      <!-- Login Form -->
      <form
        @submit.prevent="handleLogin"
        class="bg-gray-800 rounded-xl p-6 shadow-2xl"
      >
        <!-- Login Mode Tabs -->
        <div class="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            @click="loginMode = 'admin_table'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              loginMode === 'admin_table'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            <User class="w-4 h-4 inline mr-1" />
            Admin Account
          </button>
          <button
            type="button"
            @click="loginMode = 'supabase'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              loginMode === 'supabase'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            <Mail class="w-4 h-4 inline mr-1" />
            Supabase Auth
          </button>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2"
        >
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
          <span class="text-red-300 text-sm">{{ error }}</span>
        </div>

        <!-- Lockout Warning -->
        <div
          v-if="locked"
          class="mb-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg"
        >
          <p class="text-yellow-300 text-sm text-center">
            ถูกล็อคชั่วคราว กรุณารอ {{ lockTimer }} วินาที
          </p>
        </div>

        <!-- Attempts Warning -->
        <div v-if="attempts > 0 && !locked" class="mb-4 text-center">
          <span class="text-yellow-400 text-sm"
            >พยายามเข้าสู่ระบบ {{ attempts }}/{{ MAX_ATTEMPTS }} ครั้ง</span
          >
        </div>

        <div class="space-y-4">
          <!-- Username (Admin Table mode) -->
          <div v-if="loginMode === 'admin_table'">
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >ชื่อผู้ใช้</label
            >
            <div class="relative">
              <User
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="username"
                type="text"
                required
                :disabled="locked"
                class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
          </div>

          <!-- Email (Supabase mode) -->
          <div v-if="loginMode === 'supabase'">
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >อีเมล</label
            >
            <div class="relative">
              <Mail
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="email"
                type="email"
                required
                :disabled="locked"
                class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="กรอกอีเมล"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >รหัสผ่าน</label
            >
            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :disabled="locked"
                class="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading || locked"
            class="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading">กำลังตรวจสอบ...</span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </div>

        <!-- Test Credentials (Admin Table mode) -->
        <div
          v-if="loginMode === 'admin_table'"
          class="mt-6 p-4 bg-gray-700/50 rounded-lg"
        >
          <div class="flex items-center justify-center gap-2 mb-2">
            <Key class="w-4 h-4 text-gray-400" />
            <p class="text-gray-400 text-xs">
              รหัสทดสอบ (กดเพื่อกรอกอัตโนมัติ)
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              @click="
                username = 'admin';
                password = 'admin1234';
              "
              class="bg-gray-800 p-2 rounded hover:bg-gray-600 transition-colors text-left"
            >
              <p class="text-gray-500">Admin</p>
              <p class="text-green-400 font-mono">admin / admin1234</p>
            </button>
            <button
              type="button"
              @click="
                username = 'manager';
                password = 'manager1234';
              "
              class="bg-gray-800 p-2 rounded hover:bg-gray-600 transition-colors text-left"
            >
              <p class="text-gray-500">Manager</p>
              <p class="text-green-400 font-mono">manager / manager1234</p>
            </button>
          </div>
        </div>

        <!-- Supabase Auth Info -->
        <div
          v-if="loginMode === 'supabase'"
          class="mt-6 p-4 bg-gray-700/50 rounded-lg"
        >
          <p class="text-gray-400 text-xs text-center">
            ใช้บัญชี Supabase ที่มี role = 'admin' ในตาราง profiles
          </p>
        </div>

        <div class="mt-6 text-center">
          <router-link
            to="/customer"
            class="text-gray-400 hover:text-white text-sm"
          >
            ← กลับไปหน้าร้าน
          </router-link>
        </div>
      </form>

      <!-- Security Notice -->
      <div class="flex items-center justify-center gap-2 mt-6">
        <ShieldAlert class="w-4 h-4 text-gray-500" />
        <p class="text-gray-500 text-xs">การเข้าถึงถูกบันทึกและตรวจสอบ</p>
      </div>
    </div>
  </div>
</template>
