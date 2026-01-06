<script setup>
import { useRouter } from "vue-router";
import {
  ChevronLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
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
        <h1 class="text-lg font-semibold text-gray-900">เงื่อนไขการใช้งาน</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-4">
      <!-- Hero -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <div
          class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
        >
          <FileText class="w-8 h-8 text-blue-600" />
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">
          ข้อกำหนดและเงื่อนไขการใช้บริการ
        </h2>
        <p class="text-sm text-gray-600">
          กรุณาอ่านข้อกำหนดและเงื่อนไขการใช้บริการอย่างละเอียดก่อนใช้งาน
        </p>
        <p class="text-xs text-gray-500 mt-3">อัปเดตล่าสุด: 5 มกราคม 2026</p>
      </div>

      <!-- Section 1 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >1</span
          >
          การยอมรับข้อกำหนด
        </h3>
        <p class="text-sm text-gray-600 leading-relaxed">
          การใช้บริการของเราถือว่าคุณได้อ่านและยอมรับข้อกำหนดและเงื่อนไขทั้งหมดนี้แล้ว
          หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดการใช้บริการทันที
        </p>
      </div>

      <!-- Section 2 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >2</span
          >
          การสมัครสมาชิกและบัญชีผู้ใช้
        </h3>
        <div class="space-y-3 text-sm text-gray-600">
          <div class="flex items-start gap-2">
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p>คุณต้องมีอายุอย่างน้อย 18 ปีเพื่อสมัครสมาชิก</p>
          </div>
          <div class="flex items-start gap-2">
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p>ข้อมูลที่ให้ไว้ต้องเป็นความจริงและถูกต้อง</p>
          </div>
          <div class="flex items-start gap-2">
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p>คุณต้องรักษาความปลอดภัยของรหัสผ่านของคุณ</p>
          </div>
          <div class="flex items-start gap-2">
            <XCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p>ห้ามแชร์บัญชีหรือให้ผู้อื่นใช้บัญชีของคุณ</p>
          </div>
        </div>
      </div>

      <!-- Section 3 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >3</span
          >
          การสั่งซื้อและการชำระเงิน
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>• ราคาสินค้าอาจมีการเปลี่ยนแปลงโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</p>
          <p>• การสั่งซื้อจะสมบูรณ์เมื่อได้รับการยืนยันจากระบบ</p>
          <p>• การชำระเงินต้องทำผ่านช่องทางที่กำหนดเท่านั้น</p>
          <p>• เราขอสงวนสิทธิ์ในการยกเลิกคำสั่งซื้อที่ผิดปกติ</p>
        </div>
      </div>

      <!-- Section 4 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >4</span
          >
          การจัดส่งและการคืนสินค้า
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>• ระยะเวลาจัดส่งประมาณ 1-3 วันทำการ</p>
          <p>• ค่าจัดส่งขึ้นอยู่กับพื้นที่และน้ำหนักสินค้า</p>
          <p>
            • สามารถคืนสินค้าได้ภายใน 7 วันหากสินค้าชำรุดหรือไม่ตรงตามที่สั่ง
          </p>
          <p>• สินค้าที่คืนต้องอยู่ในสภาพเดิม พร้อมบรรจุภัณฑ์</p>
        </div>
      </div>

      <!-- Section 5 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >5</span
          >
          คะแนนสะสมและโปรโมชั่น
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>• คะแนนสะสมมีอายุ 1 ปีนับจากวันที่ได้รับ</p>
          <p>• 1 คะแนน = 1 บาท เมื่อใช้แลกส่วนลด</p>
          <p>• โปรโมชั่นและคูปองมีเงื่อนไขการใช้งานแยกต่างหาก</p>
          <p>• เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงหรือยกเลิกโปรโมชั่น</p>
        </div>
      </div>

      <!-- Section 6 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >6</span
          >
          ข้อจำกัดความรับผิด
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>• เราไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้บริการ</p>
          <p>• เราไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาดหรือหยุดชะงัก</p>
          <p>
            • ความรับผิดของเราจำกัดอยู่ที่มูลค่าของสินค้าที่สั่งซื้อเท่านั้น
          </p>
        </div>
      </div>

      <!-- Section 7 -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span
            class="w-6 h-6 bg-[#007f3e] text-white rounded-full flex items-center justify-center text-sm"
            >7</span
          >
          การเปลี่ยนแปลงข้อกำหนด
        </h3>
        <p class="text-sm text-gray-600 leading-relaxed">
          เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดและเงื่อนไขเหล่านี้ได้ตลอดเวลา
          การเปลี่ยนแปลงจะมีผลทันทีเมื่อประกาศบนเว็บไซต์
          การใช้บริการต่อไปถือว่าคุณยอมรับข้อกำหนดที่เปลี่ยนแปลง
        </p>
      </div>

      <!-- Warning Box -->
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div class="flex gap-3">
          <AlertCircle class="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div class="text-sm text-orange-800">
            <p class="font-medium mb-1">ข้อควรระวัง</p>
            <p>
              การละเมิดข้อกำหนดเหล่านี้อาจส่งผลให้บัญชีของคุณถูกระงับหรือยกเลิกโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            </p>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-2">ติดต่อสอบถาม</h3>
        <p class="text-sm text-gray-600 mb-3">
          หากมีข้อสงสัยเกี่ยวกับข้อกำหนดและเงื่อนไข กรุณาติดต่อ:
        </p>
        <p class="text-sm text-gray-600">
          <span class="font-medium">อีเมล:</span> legal@7eleven.com
        </p>
        <p class="text-sm text-gray-600">
          <span class="font-medium">โทร:</span> 02-123-4567
        </p>
      </div>
    </div>
  </div>
</template>
