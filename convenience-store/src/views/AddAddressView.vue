/* Path: /add-address */
<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAddressesStore } from "../stores/addresses";
import { useAuthStore } from "../stores/auth";
import { ArrowLeft, MapPin, Navigation, Loader2 } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const addressesStore = useAddressesStore();
const authStore = useAuthStore();

const label = ref("บ้าน");
const addressLine = ref("");
const district = ref("");
const province = ref("กรุงเทพมหานคร");
const postalCode = ref("");
const isDefault = ref(true);
const loading = ref(false);
const error = ref("");
const gpsLoading = ref(false);
const gpsError = ref("");
const coordinates = ref(null);

// ดึงตำแหน่ง GPS ปัจจุบัน
const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    gpsError.value = "เบราว์เซอร์ไม่รองรับ GPS";
    return;
  }

  gpsLoading.value = true;
  gpsError.value = "";

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude } = position.coords;
    coordinates.value = { lat: latitude, lng: longitude };

    // Reverse Geocoding ด้วย Nominatim (OpenStreetMap)
    await reverseGeocode(latitude, longitude);
  } catch (err) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        gpsError.value = "กรุณาอนุญาตการเข้าถึงตำแหน่ง";
        break;
      case err.POSITION_UNAVAILABLE:
        gpsError.value = "ไม่สามารถระบุตำแหน่งได้";
        break;
      case err.TIMEOUT:
        gpsError.value = "หมดเวลาในการค้นหาตำแหน่ง";
        break;
      default:
        gpsError.value = "เกิดข้อผิดพลาดในการระบุตำแหน่ง";
    }
  } finally {
    gpsLoading.value = false;
  }
};

// แปลงพิกัดเป็นที่อยู่ (ใช้ BigDataCloud API - รองรับ CORS)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=th`
    );
    const data = await response.json();

    if (data) {
      // สร้างที่อยู่จากข้อมูลที่ได้
      const parts = [];
      if (data.locality) parts.push(data.locality);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);

      if (parts.length > 0) {
        addressLine.value = parts.join(" ");
      }

      // เขต/อำเภอ
      district.value = data.city || data.locality || "";

      // จังหวัด
      province.value = data.principalSubdivision || "กรุงเทพมหานคร";

      // รหัสไปรษณีย์
      if (data.postcode) {
        postalCode.value = data.postcode;
      }
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    // ไม่แสดง error เพราะยังมีพิกัดอยู่
  }
};

const labels = ["บ้าน", "ที่ทำงาน", "อื่นๆ"];

const handleSubmit = async () => {
  if (!addressLine.value.trim()) {
    error.value = "กรุณากรอกที่อยู่";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await addressesStore.addAddress({
      label: label.value,
      address_line: addressLine.value,
      district: district.value,
      province: province.value,
      postal_code: postalCode.value,
      is_default: isDefault.value,
    });

    // Redirect back
    const redirect = route.query.redirect || "/customer/profile";
    router.push(redirect);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="bg-[#f3f4f6] min-h-screen">
    <!-- Header -->
    <div class="bg-white px-4 py-4 flex items-center gap-3 border-b">
      <button @click="router.back()">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-lg font-bold">เพิ่มที่อยู่ใหม่</h1>
    </div>

    <div class="px-4 py-4">
      <!-- Error -->
      <div
        v-if="error"
        class="bg-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4"
      >
        {{ error }}
      </div>

      <div class="space-y-4">
        <!-- Label Selection -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <label class="text-sm text-gray-600 mb-2 block">ประเภทที่อยู่</label>
          <div class="flex gap-2">
            <button
              v-for="l in labels"
              :key="l"
              @click="label = l"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              :class="
                label === l
                  ? 'bg-[#007f3e] text-white'
                  : 'bg-gray-100 text-gray-600'
              "
            >
              {{ l }}
            </button>
          </div>
        </div>

        <!-- GPS Button -->
        <button
          @click="getCurrentLocation"
          :disabled="gpsLoading"
          class="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-center gap-3 border-2 border-dashed border-[#007f3e] text-[#007f3e] hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <Loader2 v-if="gpsLoading" class="w-5 h-5 animate-spin" />
          <Navigation v-else class="w-5 h-5" />
          <span class="font-medium">
            {{ gpsLoading ? "กำลังค้นหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน" }}
          </span>
        </button>

        <!-- GPS Error -->
        <div
          v-if="gpsError"
          class="bg-orange-100 text-orange-600 px-4 py-3 rounded-xl text-sm"
        >
          {{ gpsError }}
        </div>

        <!-- GPS Success -->
        <div
          v-if="coordinates"
          class="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
        >
          <MapPin class="w-4 h-4" />
          <span
            >พิกัด: {{ coordinates.lat.toFixed(6) }},
            {{ coordinates.lng.toFixed(6) }}</span
          >
        </div>

        <!-- Address Form -->
        <div class="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">ที่อยู่ *</label>
            <textarea
              v-model="addressLine"
              placeholder="บ้านเลขที่ ซอย ถนน..."
              class="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
              rows="3"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm text-gray-600 mb-1 block">เขต/อำเภอ</label>
              <input
                v-model="district"
                type="text"
                placeholder="เขต/อำเภอ"
                class="w-full p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block"
                >รหัสไปรษณีย์</label
              >
              <input
                v-model="postalCode"
                type="text"
                placeholder="10xxx"
                maxlength="5"
                class="w-full p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1 block">จังหวัด</label>
            <input
              v-model="province"
              type="text"
              placeholder="จังหวัด"
              class="w-full p-3 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="isDefault"
              class="w-5 h-5 accent-[#007f3e] rounded"
            />
            <span class="text-sm text-gray-700">ตั้งเป็นที่อยู่หลัก</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="w-full bg-[#007f3e] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
        >
          {{ loading ? "กำลังบันทึก..." : "บันทึกที่อยู่" }}
        </button>
      </div>
    </div>
  </div>
</template>
