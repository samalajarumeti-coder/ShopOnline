<!-- Design System View - Designer-friendly component showcase -->
<script setup>
import { ref } from "vue";
import {
  Palette,
  Type,
  Layout,
  Grid,
  Layers,
  Box,
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  ShoppingCart,
  User,
  Search,
  Bell,
  Settings,
  Home,
  Package,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
} from "lucide-vue-next";

const activeTab = ref("colors");

const tabs = [
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "spacing", label: "Spacing", icon: Grid },
  { id: "components", label: "Components", icon: Layers },
  { id: "icons", label: "Icons", icon: Star },
  { id: "layouts", label: "Layouts", icon: Layout },
];

const colors = {
  primary: [
    {
      name: "Primary Green",
      value: "#007f3e",
      usage: "Main brand color, CTAs",
    },
    { name: "Primary Hover", value: "#006633", usage: "Hover states" },
    { name: "Primary Light", value: "#00a050", usage: "Gradients, accents" },
  ],
  secondary: [
    { name: "Orange", value: "#ff6b00", usage: "Flash sales, urgency" },
    { name: "Red", value: "#dc2626", usage: "Errors, delete actions" },
    { name: "Yellow", value: "#fbbf24", usage: "Warnings, ratings" },
    { name: "Blue", value: "#3b82f6", usage: "Info, links" },
  ],
  neutral: [
    { name: "Gray 50", value: "#f9fafb", usage: "Backgrounds" },
    { name: "Gray 100", value: "#f3f4f6", usage: "Cards, sections" },
    { name: "Gray 300", value: "#d1d5db", usage: "Borders" },
    { name: "Gray 500", value: "#6b7280", usage: "Secondary text" },
    { name: "Gray 700", value: "#374151", usage: "Body text" },
    { name: "Gray 900", value: "#111827", usage: "Headings" },
  ],
};

const typography = [
  { name: "Display", size: "2.5rem", weight: "700", usage: "Hero sections" },
  { name: "H1", size: "2rem", weight: "700", usage: "Page titles" },
  { name: "H2", size: "1.5rem", weight: "600", usage: "Section headers" },
  { name: "H3", size: "1.25rem", weight: "600", usage: "Card titles" },
  { name: "Body Large", size: "1.125rem", weight: "400", usage: "Large text" },
  { name: "Body", size: "1rem", weight: "400", usage: "Default text" },
  { name: "Body Small", size: "0.875rem", weight: "400", usage: "Captions" },
  { name: "Caption", size: "0.75rem", weight: "400", usage: "Tiny text" },
];

const spacing = [
  { name: "xs", value: "0.25rem", px: "4px" },
  { name: "sm", value: "0.5rem", px: "8px" },
  { name: "md", value: "1rem", px: "16px" },
  { name: "lg", value: "1.5rem", px: "24px" },
  { name: "xl", value: "2rem", px: "32px" },
  { name: "2xl", value: "3rem", px: "48px" },
];

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert(`Copied: ${text}`);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <div class="bg-white border-b sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-gray-900">🎨 Design System</h1>
        <p class="text-sm text-gray-500 mt-1">
          7-Eleven Store Component Library
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white border-b sticky top-[73px] z-10">
      <div class="max-w-6xl mx-auto px-4">
        <div class="flex gap-1 overflow-x-auto hide-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'text-[#007f3e] border-b-2 border-[#007f3e]'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <!-- Colors Tab -->
      <div v-if="activeTab === 'colors'" class="space-y-8">
        <div v-for="(colorGroup, groupName) in colors" :key="groupName">
          <h2 class="text-xl font-bold text-gray-900 mb-4 capitalize">
            {{ groupName }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="color in colorGroup"
              :key="color.value"
              class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              @click="copyToClipboard(color.value)"
            >
              <div
                class="w-full h-20 rounded-lg mb-3 shadow-inner"
                :style="{ backgroundColor: color.value }"
              ></div>
              <h3 class="font-semibold text-gray-900">{{ color.name }}</h3>
              <p class="text-sm text-gray-500 font-mono mt-1">
                {{ color.value }}
              </p>
              <p class="text-xs text-gray-400 mt-2">{{ color.usage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Typography Tab -->
      <div v-if="activeTab === 'typography'" class="space-y-6">
        <div
          v-for="type in typography"
          :key="type.name"
          class="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">{{ type.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ type.usage }}</p>
            </div>
            <div class="text-right text-sm text-gray-500">
              <div>{{ type.size }}</div>
              <div>{{ type.weight }}</div>
            </div>
          </div>
          <p
            :style="{
              fontSize: type.size,
              fontWeight: type.weight,
            }"
            class="text-gray-900"
          >
            The quick brown fox jumps over the lazy dog
          </p>
          <p
            :style="{
              fontSize: type.size,
              fontWeight: type.weight,
            }"
            class="text-gray-900 mt-2"
          >
            ก ข ค ง จ ฉ ช ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด ต ถ ท ธ น บ ป ผ ฝ พ ฟ ภ ม ย ร ล ว
            ศ ษ ส ห ฬ อ ฮ
          </p>
        </div>
      </div>

      <!-- Spacing Tab -->
      <div v-if="activeTab === 'spacing'" class="space-y-6">
        <div
          v-for="space in spacing"
          :key="space.name"
          class="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">{{ space.name }}</h3>
            <div class="text-sm text-gray-500">
              {{ space.value }} / {{ space.px }}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="bg-[#007f3e] rounded"
              :style="{ width: space.value, height: space.value }"
            ></div>
            <div class="text-sm text-gray-500">
              Use for margins, padding, gaps
            </div>
          </div>
        </div>
      </div>

      <!-- Components Tab -->
      <div v-if="activeTab === 'components'" class="space-y-8">
        <!-- Buttons -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Buttons</h2>
          <div class="space-y-4">
            <div class="flex flex-wrap gap-3">
              <button
                class="bg-[#007f3e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#006633] transition-colors"
              >
                Primary Button
              </button>
              <button
                class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Secondary Button
              </button>
              <button
                class="border-2 border-[#007f3e] text-[#007f3e] px-6 py-3 rounded-xl font-medium hover:bg-[#007f3e] hover:text-white transition-colors"
              >
                Outline Button
              </button>
              <button
                class="text-[#007f3e] px-6 py-3 rounded-xl font-medium hover:bg-green-50 transition-colors"
              >
                Text Button
              </button>
            </div>
          </div>
        </div>

        <!-- Cards -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Cards</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              class="bg-white rounded-xl p-4 shadow-md border border-gray-200"
            >
              <div class="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
              <h3 class="font-semibold text-gray-900">Product Card</h3>
              <p class="text-sm text-gray-500 mt-1">฿99.00</p>
            </div>
            <div
              class="bg-gradient-to-r from-[#007f3e] to-[#00a050] rounded-xl p-4 text-white shadow-md"
            >
              <h3 class="font-semibold">Promotion Card</h3>
              <p class="text-sm mt-1 opacity-90">Special offer inside</p>
            </div>
          </div>
        </div>

        <!-- Inputs -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Form Inputs</h2>
          <div class="space-y-4 max-w-md">
            <input
              type="text"
              placeholder="Text Input"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
            />
            <textarea
              placeholder="Textarea"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
            ></textarea>
            <select
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007f3e] focus:border-transparent"
            >
              <option>Select Option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>

        <!-- Badges -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Badges</h2>
          <div class="flex flex-wrap gap-3">
            <span
              class="bg-[#007f3e] text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Success
            </span>
            <span
              class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Error
            </span>
            <span
              class="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Warning
            </span>
            <span
              class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Info
            </span>
            <span
              class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              Neutral
            </span>
          </div>
        </div>
      </div>

      <!-- Icons Tab -->
      <div v-if="activeTab === 'icons'" class="space-y-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Lucide Icons</h2>
          <p class="text-sm text-gray-500 mb-6">
            Using lucide-vue-next icon library
          </p>
          <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Home class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Home</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Search class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Search</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <ShoppingCart class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Cart</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <User class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">User</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Bell class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Bell</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Settings class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Settings</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Package class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Package</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Heart class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Heart</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Star class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Star</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Plus class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Plus</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Minus class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Minus</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <X class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">X</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <Check class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Check</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <ChevronRight class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Chevron</span>
            </div>
            <div
              class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <AlertCircle class="w-6 h-6 text-gray-700" />
              <span class="text-xs text-gray-500">Alert</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Layouts Tab -->
      <div v-if="activeTab === 'layouts'" class="space-y-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">
            Mobile Layout (Max 480px)
          </h2>
          <p class="text-sm text-gray-500 mb-6">
            All customer views are optimized for mobile-first design
          </p>

          <div class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div class="text-sm font-medium text-gray-700 mb-2">
                Header (Fixed)
              </div>
              <div class="bg-gray-100 h-16 rounded"></div>
            </div>

            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div class="text-sm font-medium text-gray-700 mb-2">
                Content (Scrollable)
              </div>
              <div class="bg-gray-50 h-64 rounded"></div>
            </div>

            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div class="text-sm font-medium text-gray-700 mb-2">
                Bottom Navigation (Fixed)
              </div>
              <div class="bg-gray-100 h-16 rounded"></div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Grid System</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-[#007f3e] h-20 rounded-lg"></div>
              <div class="bg-[#007f3e] h-20 rounded-lg"></div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-[#00a050] h-20 rounded-lg"></div>
              <div class="bg-[#00a050] h-20 rounded-lg"></div>
              <div class="bg-[#00a050] h-20 rounded-lg"></div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-[#006633] h-20 rounded-lg"></div>
              <div class="bg-[#006633] h-20 rounded-lg"></div>
              <div class="bg-[#006633] h-20 rounded-lg"></div>
              <div class="bg-[#006633] h-20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
