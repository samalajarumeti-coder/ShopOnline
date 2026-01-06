<script setup>
import { useRouter } from "vue-router";
import {
  ChevronLeft,
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
} from "lucide-vue-next";

const router = useRouter();
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
        <h1 class="text-lg font-semibold text-gray-900">ความเป็นส่วนตัว</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-4">
      <!-- Hero Card -->
      <div
        class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
      >
        <div
          class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
        >
          <Shield class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold mb-2">เราใส่ใจความปลอดภัยของคุณ</h2>
        <p class="text-sm opacity-90">
          ข้อมูลส่วนตัวของคุณได้รับการปกป้องด้วยมาตรฐานความปลอดภัยสูงสุด
        </p>
      </div>

      <!-- Privacy Sections -->
      <div class="space-y-3">
        <!-- Data Collection -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-start gap-3 mb-3">
            <div
              class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Database class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">
                ข้อมูลที่เราเก็บรวบรวม
              </h3>
              <p class="text-sm text-gray-600">
                เราเก็บข้อมูลที่จำเป็นเท่านั้น เช่น ชื่อ-นามสกุล, อีเมล,
                เบอร์โทรศัพท์, ที่อยู่จัดส่ง และประวัติการสั่งซื้อ
                เพื่อให้บริการที่ดีที่สุดแก่คุณ
              </p>
            </div>
          </div>
        </div>

        <!-- Data Usage -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-start gap-3 mb-3">
            <div
              class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Eye class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">การใช้ข้อมูล</h3>
              <p class="text-sm text-gray-600 mb-2">
                ข้อมูลของคุณจะถูกใช้เพื่อ:
              </p>
              <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>ประมวลผลคำสั่งซื้อและจัดส่งสินค้า</li>
                <li>ปรับปรุงประสบการณ์การใช้งาน</li>
                <li>แจ้งข่าวสารและโปรโมชั่น (ถ้าคุณยินยอม)</li>
                <li>ป้องกันการฉ้อโกงและรักษาความปลอดภัย</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Data Security -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-start gap-3 mb-3">
            <div
              class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Lock class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">
                ความปลอดภัยของข้อมูล
              </h3>
              <p class="text-sm text-gray-600">
                เราใช้เทคโนโลยีการเข้ารหัส SSL/TLS
                และมาตรการรักษาความปลอดภัยตามมาตรฐานสากล
                เพื่อปกป้องข้อมูลของคุณจากการเข้าถึงโดยไม่ได้รับอนุญาต
              </p>
            </div>
          </div>
        </div>

        <!-- User Rights -->
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-start gap-3 mb-3">
            <div
              class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <UserCheck class="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">สิทธิของคุณ</h3>
              <p class="text-sm text-gray-600 mb-2">คุณมีสิทธิ์ในการ:</p>
              <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>เข้าถึงและแก้ไขข้อมูลส่วนตัว</li>
                <li>ขอลบข้อมูลของคุณ</li>
                <li>ถอนความยินยอมการใช้ข้อมูล</li>
                <li>ปฏิเสธการรับข่าวสารทางการตลาด</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-2">
          ติดต่อเรื่องความเป็นส่วนตัว
        </h3>
        <p class="text-sm text-gray-600 mb-3">
          หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว กรุณาติดต่อ:
        </p>
        <p class="text-sm text-gray-600">
          <span class="font-medium">อีเมล:</span> privacy@7eleven.com
        </p>
      </div>

      <!-- Last Updated -->
      <div class="text-center py-4">
        <p class="text-xs text-gray-400">อัปเดตล่าสุด: 5 มกราคม 2026</p>
      </div>
    </div>
  </div>
</template>
