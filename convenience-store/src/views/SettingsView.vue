<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Globe, Moon, Bell, Smartphone } from "lucide-vue-next";

const router = useRouter();

const settings = ref({
  language: "th",
  theme: "light",
  notifications: true,
  pushNotifications: true,
});

const languages = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "English" },
];

const themes = [
  { value: "light", label: "สว่าง" },
  { value: "dark", label: "มืด" },
  { value: "auto", label: "ตามระบบ" },
];
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
        <h1 class="text-lg font-semibold text-gray-900">ตั้งค่าทั่วไป</h1>
      </div>
    </div>

    <!-- Settings -->
    <div class="p-4 space-y-4">
      <!-- Language -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <Globe class="w-5 h-5 text-gray-400" />
          <h3 class="font-semibold text-gray-900">ภาษา</h3>
        </div>
        <div class="space-y-2">
          <label
            v-for="lang in languages"
            :key="lang.value"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              v-model="settings.language"
              type="radio"
              :value="lang.value"
              class="w-4 h-4 text-[#007f3e] focus:ring-[#007f3e]"
            />
            <span class="text-gray-700">{{ lang.label }}</span>
          </label>
        </div>
      </div>

      <!-- Theme -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <Moon class="w-5 h-5 text-gray-400" />
          <h3 class="font-semibold text-gray-900">ธีม</h3>
        </div>
        <div class="space-y-2">
          <label
            v-for="theme in themes"
            :key="theme.value"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              v-model="settings.theme"
              type="radio"
              :value="theme.value"
              class="w-4 h-4 text-[#007f3e] focus:ring-[#007f3e]"
            />
            <span class="text-gray-700">{{ theme.label }}</span>
          </label>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <Bell class="w-5 h-5 text-gray-400" />
          <h3 class="font-semibold text-gray-900">การแจ้งเตือน</h3>
        </div>
        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-700">เปิดการแจ้งเตือน</span>
            <input
              v-model="settings.notifications"
              type="checkbox"
              class="w-12 h-6 rounded-full appearance-none bg-gray-300 checked:bg-[#007f3e] relative cursor-pointer transition-colors before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
            />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-gray-700">Push Notifications</p>
              <p class="text-xs text-gray-500">แจ้งเตือนผ่านมือถือ</p>
            </div>
            <input
              v-model="settings.pushNotifications"
              type="checkbox"
              :disabled="!settings.notifications"
              class="w-12 h-6 rounded-full appearance-none bg-gray-300 checked:bg-[#007f3e] relative cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
            />
          </label>
        </div>
      </div>

      <!-- App Info -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <Smartphone class="w-5 h-5 text-gray-400" />
          <h3 class="font-semibold text-gray-900">ข้อมูลแอป</h3>
        </div>
        <div class="space-y-2 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>เวอร์ชัน</span>
            <span class="font-medium">1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span>อัปเดตล่าสุด</span>
            <span class="font-medium">5 ม.ค. 2026</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
