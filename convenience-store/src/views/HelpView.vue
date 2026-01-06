<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ChevronLeft,
  ChevronDown,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-vue-next";

const router = useRouter();

const faqs = ref([
  {
    id: 1,
    question: "จะสั่งซื้อสินค้าได้อย่างไร?",
    answer:
      "เลือกสินค้าที่ต้องการ กดเพิ่มลงตะกร้า จากนั้นไปที่หน้าตะกร้าสินค้า ตรวจสอบรายการและกดชำระเงิน กรอกข้อมูลที่อยู่จัดส่งและเลือกวิธีการชำระเงิน",
    open: false,
  },
  {
    id: 2,
    question: "มีวิธีการชำระเงินอะไรบ้าง?",
    answer:
      "รับชำระผ่านบัตรเครดิต/เดบิต, โอนเงินผ่านธนาคาร, พร้อมเพย์, และเก็บเงินปลายทาง (COD)",
    open: false,
  },
  {
    id: 3,
    question: "ใช้เวลาจัดส่งนานแค่ไหน?",
    answer:
      "ระยะเวลาจัดส่งประมาณ 1-3 วันทำการ ขึ้นอยู่กับพื้นที่จัดส่ง สำหรับกรุงเทพและปริมณฑล จัดส่งภายใน 1-2 วัน",
    open: false,
  },
  {
    id: 4,
    question: "สามารถยกเลิกคำสั่งซื้อได้หรือไม่?",
    answer:
      "สามารถยกเลิกได้ก่อนที่สินค้าจะถูกจัดส่ง โดยไปที่หน้าประวัติคำสั่งซื้อ เลือกคำสั่งซื้อที่ต้องการยกเลิก และกดปุ่มยกเลิก",
    open: false,
  },
  {
    id: 5,
    question: "จะติดตามสถานะการจัดส่งได้อย่างไร?",
    answer:
      "ไปที่หน้าประวัติคำสั่งซื้อ เลือกคำสั่งซื้อที่ต้องการดู จะเห็นสถานะการจัดส่งและเลขพัสดุ (ถ้ามี)",
    open: false,
  },
  {
    id: 6,
    question: "คะแนนสะสมใช้ทำอะไรได้บ้าง?",
    answer:
      "คะแนนสะสมสามารถใช้แลกส่วนลด, แลกของรางวัล หรือใช้ลดราคาสินค้าในครั้งถัดไป โดย 1 คะแนน = 1 บาท",
    open: false,
  },
  {
    id: 7,
    question: "สินค้าชำรุดหรือไม่ตรงตามที่สั่งต้องทำอย่างไร?",
    answer:
      "กรุณาติดต่อฝ่ายบริการลูกค้าภายใน 7 วันหลังได้รับสินค้า พร้อมแนบรูปถ่ายสินค้า เราจะดำเนินการเปลี่ยนสินค้าหรือคืนเงินให้",
    open: false,
  },
]);

const toggleFaq = (id) => {
  const faq = faqs.value.find((f) => f.id === id);
  if (faq) {
    faq.open = !faq.open;
  }
};
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
        <h1 class="text-lg font-semibold text-gray-900">ศูนย์ช่วยเหลือ</h1>
      </div>
    </div>

    <!-- Contact Cards -->
    <div class="p-4 space-y-3">
      <div
        class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
      >
        <h2 class="text-xl font-bold mb-2">ต้องการความช่วยเหลือ?</h2>
        <p class="text-sm opacity-90 mb-4">ติดต่อเราได้ทุกวัน 24 ชั่วโมง</p>
        <div class="grid grid-cols-3 gap-3">
          <a
            href="tel:021234567"
            class="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors"
          >
            <Phone class="w-6 h-6" />
            <span class="text-xs">โทร</span>
          </a>
          <a
            href="mailto:support@7eleven.com"
            class="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors"
          >
            <Mail class="w-6 h-6" />
            <span class="text-xs">อีเมล</span>
          </a>
          <button
            class="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors"
          >
            <MessageCircle class="w-6 h-6" />
            <span class="text-xs">แชท</span>
          </button>
        </div>
      </div>
    </div>

    <!-- FAQs -->
    <div class="px-4 pb-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">คำถามที่พบบ่อย</h2>
      <div class="space-y-2">
        <div
          v-for="faq in faqs"
          :key="faq.id"
          class="bg-white rounded-xl overflow-hidden shadow-sm"
        >
          <button
            @click="toggleFaq(faq.id)"
            class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span class="font-medium text-gray-900 pr-4">{{
              faq.question
            }}</span>
            <ChevronDown
              class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform"
              :class="{ 'rotate-180': faq.open }"
            />
          </button>
          <div
            v-show="faq.open"
            class="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3"
          >
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Info -->
    <div class="px-4 pb-8">
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3">ข้อมูลติดต่อ</h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p><span class="font-medium">โทร:</span> 02-123-4567</p>
          <p><span class="font-medium">อีเมล:</span> support@7eleven.com</p>
          <p><span class="font-medium">เวลาทำการ:</span> 24 ชั่วโมง ทุกวัน</p>
        </div>
      </div>
    </div>
  </div>
</template>
