<script setup>
import { ref, watch } from "vue";
import { useStoreSettings } from "../composables/useStoreSettings";
import {
  X,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileText,
  Facebook,
  MessageCircle,
  Image,
  Settings2,
} from "lucide-vue-next";

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "saved"]);

const {
  settings,
  saveSettings,
  resetSettings,
  exportSettings,
  importSettings,
  DEFAULT_SETTINGS,
} = useStoreSettings();

// Local form state
const form = ref({ ...settings.value });
const activeTab = ref("basic");
const saving = ref(false);
const message = ref({ type: "", text: "" });
const fileInput = ref(null);

// Sync form when settings change
watch(
  () => settings.value,
  (newVal) => {
    form.value = { ...newVal };
  },
  { immediate: true }
);

// Reset form when modal opens
watch(
  () => props.show,
  (show) => {
    if (show) {
      form.value = { ...settings.value };
      message.value = { type: "", text: "" };
    }
  }
);

const tabs = [
  { id: "basic", label: "ข้อมูลร้าน", icon: Store },
  { id: "contact", label: "ติดต่อ", icon: Phone },
  { id: "invoice", label: "ใบเสร็จ", icon: FileText },
];

async function handleSave() {
  saving.value = true;
  message.value = { type: "", text: "" };

  try {
    const success = saveSettings(form.value);
    if (success) {
      message.value = { type: "success", text: "บันทึกการตั้งค่าเรียบร้อย" };
      emit("saved", form.value);
      setTimeout(() => emit("close"), 1000);
    } else {
      throw new Error("Failed to save");
    }
  } catch (e) {
    message.value = { type: "error", text: "เกิดข้อผิดพลาดในการบันทึก" };
  } finally {
    saving.value = false;
  }
}

function handleReset() {
  if (confirm("ต้องการรีเซ็ตเป็นค่าเริ่มต้นหรือไม่?")) {
    resetSettings();
    form.value = { ...DEFAULT_SETTINGS };
    message.value = { type: "success", text: "รีเซ็ตเรียบร้อย" };
  }
}

function handleExport() {
  exportSettings();
  message.value = { type: "success", text: "ส่งออกไฟล์เรียบร้อย" };
}

function triggerImport() {
  fileInput.value?.click();
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await importSettings(file);
    form.value = { ...settings.value };
    message.value = { type: "success", text: "นำเข้าการตั้งค่าเรียบร้อย" };
  } catch (e) {
    message.value = { type: "error", text: e.message || "นำเข้าไม่สำเร็จ" };
  }

  event.target.value = "";
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b bg-gray-50">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <Settings2 class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold">ตั้งค่าข้อมูลร้าน</h2>
              <p class="text-sm text-gray-500">กำหนดข้อมูลที่แสดงในใบเสร็จ</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-gray-200 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b bg-gray-50 px-4">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Message -->
          <div
            v-if="message.text"
            :class="[
              'mb-4 p-3 rounded-lg text-sm',
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700',
            ]"
          >
            {{ message.text }}
          </div>

          <!-- Basic Info Tab -->
          <div v-show="activeTab === 'basic'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Store class="w-4 h-4 inline mr-1" />ชื่อร้าน (ภาษาอังกฤษ)
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Store Name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Store class="w-4 h-4 inline mr-1" />ชื่อร้าน (ภาษาไทย)
              </label>
              <input
                v-model="form.nameTh"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="ชื่อร้านค้า"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <MapPin class="w-4 h-4 inline mr-1" />ที่อยู่ร้าน
              </label>
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="ที่อยู่เต็ม"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Hash class="w-4 h-4 inline mr-1" />เลขประจำตัวผู้เสียภาษี
              </label>
              <input
                v-model="form.taxId"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0-0000-00000-00-0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Image class="w-4 h-4 inline mr-1" />URL โลโก้ร้าน
              </label>
              <input
                v-model="form.logoUrl"
                type="url"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/logo.png"
              />
              <p class="text-xs text-gray-500 mt-1">แนะนำขนาด 200x200 พิกเซล</p>
            </div>
          </div>

          <!-- Contact Tab -->
          <div v-show="activeTab === 'contact'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Phone class="w-4 h-4 inline mr-1" />เบอร์โทรศัพท์
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="02-xxx-xxxx"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Mail class="w-4 h-4 inline mr-1" />อีเมล
              </label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="contact@store.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Globe class="w-4 h-4 inline mr-1" />เว็บไซต์
              </label>
              <input
                v-model="form.website"
                type="url"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://www.store.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <MessageCircle class="w-4 h-4 inline mr-1" />LINE ID
              </label>
              <input
                v-model="form.lineId"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="@storeline"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <Facebook class="w-4 h-4 inline mr-1" />Facebook URL
              </label>
              <input
                v-model="form.facebookUrl"
                type="url"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://facebook.com/storepage"
              />
            </div>
          </div>

          <!-- Invoice Tab -->
          <div v-show="activeTab === 'invoice'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                รหัสนำหน้าใบเสร็จ (Prefix)
              </label>
              <input
                v-model="form.invoicePrefix"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="INV"
              />
              <p class="text-xs text-gray-500 mt-1">
                ตัวอย่าง: INV-202601-000001
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ขนาดกระดาษ
              </label>
              <select
                v-model="form.paperSize"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="a5">A5 (148 x 210 mm)</option>
                <option value="thermal">Thermal 80mm</option>
              </select>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700"
                >แสดงในใบเสร็จ</label
              >

              <label class="flex items-center gap-2">
                <input
                  v-model="form.showLogo"
                  type="checkbox"
                  class="rounded text-green-600"
                />
                <span class="text-sm">แสดงโลโก้ร้าน</span>
              </label>

              <label class="flex items-center gap-2">
                <input
                  v-model="form.showTaxId"
                  type="checkbox"
                  class="rounded text-green-600"
                />
                <span class="text-sm">แสดงเลขประจำตัวผู้เสียภาษี</span>
              </label>

              <label class="flex items-center gap-2">
                <input
                  v-model="form.showWebsite"
                  type="checkbox"
                  class="rounded text-green-600"
                />
                <span class="text-sm">แสดงเว็บไซต์</span>
              </label>

              <label class="flex items-center gap-2">
                <input
                  v-model="form.showSocial"
                  type="checkbox"
                  class="rounded text-green-600"
                />
                <span class="text-sm">แสดง LINE / Facebook</span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ข้อความท้ายใบเสร็จ
              </label>
              <input
                v-model="form.footerMessage"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="ขอบคุณที่ใช้บริการ"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุเพิ่มเติม (ท้ายใบเสร็จ)
              </label>
              <textarea
                v-model="form.footerNote"
                rows="2"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="เช่น นโยบายการคืนสินค้า, เงื่อนไขการรับประกัน"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between p-4 border-t bg-gray-50">
          <div class="flex gap-2">
            <button
              @click="handleExport"
              class="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <Download class="w-4 h-4" />
              <span>ส่งออก</span>
            </button>
            <button
              @click="triggerImport"
              class="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <Upload class="w-4 h-4" />
              <span>นำเข้า</span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleImport"
            />
          </div>

          <div class="flex gap-2">
            <button
              @click="handleReset"
              class="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <RotateCcw class="w-4 h-4" />
              <span>รีเซ็ต</span>
            </button>
            <button
              @click="handleSave"
              :disabled="saving"
              class="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save class="w-4 h-4" />
              <span>{{ saving ? "กำลังบันทึก..." : "บันทึก" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
