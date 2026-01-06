<script setup>
import { computed } from "vue";
import {
  Printer,
  Store,
  Phone,
  MapPin,
  Mail,
  Globe,
  MessageCircle,
  Facebook,
} from "lucide-vue-next";
import { useStoreSettings } from "../composables/useStoreSettings";

const props = defineProps({
  order: { type: Object, required: true },
  showPrintButton: { type: Boolean, default: true },
});

const emit = defineEmits(["print"]);

const { settings } = useStoreSettings();

// Computed store info from settings
const storeInfo = computed(() => ({
  name: settings.value.name,
  nameTh: settings.value.nameTh,
  address: settings.value.address,
  phone: settings.value.phone,
  email: settings.value.email,
  taxId: settings.value.taxId,
  website: settings.value.website,
  lineId: settings.value.lineId,
  facebookUrl: settings.value.facebookUrl,
  logoUrl: settings.value.logoUrl,
  showLogo: settings.value.showLogo,
  showTaxId: settings.value.showTaxId,
  showWebsite: settings.value.showWebsite,
  showSocial: settings.value.showSocial,
  footerMessage: settings.value.footerMessage,
  footerNote: settings.value.footerNote,
  invoicePrefix: settings.value.invoicePrefix,
  paperSize: settings.value.paperSize,
}));

const formatDate = (date) => {
  return new Date(date).toLocaleString("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

const invoiceNumber = computed(() => {
  const date = new Date(props.order.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = storeInfo.value.invoicePrefix || "INV";
  return `${prefix}-${year}${month}-${String(props.order.id).padStart(6, "0")}`;
});

const statusLabel = computed(() => {
  const labels = {
    pending: "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    preparing: "กำลังจัดเตรียม",
    delivering: "กำลังจัดส่ง",
    completed: "จัดส่งสำเร็จ",
    cancelled: "ยกเลิก",
  };
  return labels[props.order.status] || props.order.status;
});

const paymentLabel = computed(() => {
  return props.order.payment_method === "cash" ? "ชำระเงินสด" : "ชำระด้วยบัตร";
});

function printInvoice() {
  emit("print");
  window.print();
}
</script>

<template>
  <div class="invoice-container bg-white">
    <!-- Print Button (hidden in print) -->
    <div v-if="showPrintButton" class="print:hidden mb-4 flex justify-end">
      <button
        @click="printInvoice"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Printer class="w-4 h-4" />
        <span>พิมพ์ใบเสร็จ</span>
      </button>
    </div>

    <!-- Invoice Content -->
    <div
      class="invoice-content p-8 border border-gray-200 rounded-lg print:border-0 print:p-0"
    >
      <!-- Header -->
      <div
        class="flex justify-between items-start mb-8 pb-6 border-b-2 border-green-600"
      >
        <div class="flex items-center gap-4">
          <div
            v-if="storeInfo.showLogo && storeInfo.logoUrl"
            class="w-16 h-16 rounded-xl overflow-hidden"
          >
            <img
              :src="storeInfo.logoUrl"
              :alt="storeInfo.name"
              class="w-full h-full object-contain"
            />
          </div>
          <div
            v-else
            class="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center"
          >
            <Store class="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-green-600">
              {{ storeInfo.name }}
            </h1>
            <p v-if="storeInfo.nameTh" class="text-gray-600 text-sm">
              {{ storeInfo.nameTh }}
            </p>
            <p class="text-gray-500 text-sm mt-1">ใบเสร็จรับเงิน / Receipt</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-gray-800">{{ invoiceNumber }}</p>
          <p class="text-sm text-gray-500">
            {{ formatDate(order.created_at) }}
          </p>
        </div>
      </div>

      <!-- Store & Customer Info -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <!-- Store Info -->
        <div>
          <h3 class="font-bold text-gray-800 mb-3">ข้อมูลร้านค้า</h3>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-start gap-2">
              <MapPin class="w-4 h-4 mt-0.5 text-gray-400" />
              <span>{{ storeInfo.address }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Phone class="w-4 h-4 text-gray-400" />
              <span>{{ storeInfo.phone }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Mail class="w-4 h-4 text-gray-400" />
              <span>{{ storeInfo.email }}</span>
            </div>
            <div
              v-if="storeInfo.showWebsite && storeInfo.website"
              class="flex items-center gap-2"
            >
              <Globe class="w-4 h-4 text-gray-400" />
              <span>{{ storeInfo.website }}</span>
            </div>
            <div
              v-if="storeInfo.showSocial && storeInfo.lineId"
              class="flex items-center gap-2"
            >
              <MessageCircle class="w-4 h-4 text-gray-400" />
              <span>LINE: {{ storeInfo.lineId }}</span>
            </div>
            <p
              v-if="storeInfo.showTaxId && storeInfo.taxId"
              class="text-xs text-gray-400 mt-2"
            >
              เลขประจำตัวผู้เสียภาษี: {{ storeInfo.taxId }}
            </p>
          </div>
        </div>

        <!-- Customer Info -->
        <div>
          <h3 class="font-bold text-gray-800 mb-3">ข้อมูลลูกค้า</h3>
          <div class="space-y-2 text-sm text-gray-600">
            <p class="font-medium">
              {{ order.addresses?.label || "ไม่ระบุชื่อ" }}
            </p>
            <p>{{ order.addresses?.address_line || "-" }}</p>
            <p>
              {{ order.addresses?.district }} {{ order.addresses?.province }}
              {{ order.addresses?.postal_code }}
            </p>
            <p v-if="order.addresses?.phone">
              โทร: {{ order.addresses?.phone }}
            </p>
          </div>
        </div>
      </div>

      <!-- Order Info -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6 print:bg-gray-100">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-gray-500">เลขที่คำสั่งซื้อ</p>
            <p class="font-bold text-green-600">#{{ order.id }}</p>
          </div>
          <div>
            <p class="text-gray-500">สถานะ</p>
            <p class="font-medium">{{ statusLabel }}</p>
          </div>
          <div>
            <p class="text-gray-500">การชำระเงิน</p>
            <p class="font-medium">{{ paymentLabel }}</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="w-full mb-6">
        <thead>
          <tr class="border-b-2 border-gray-200">
            <th class="text-left py-3 text-sm font-bold text-gray-700">
              รายการ
            </th>
            <th class="text-center py-3 text-sm font-bold text-gray-700 w-24">
              จำนวน
            </th>
            <th class="text-right py-3 text-sm font-bold text-gray-700 w-32">
              ราคา/หน่วย
            </th>
            <th class="text-right py-3 text-sm font-bold text-gray-700 w-32">
              รวม
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in order.order_items"
            :key="item.id"
            :class="index % 2 === 0 ? 'bg-gray-50' : ''"
            class="print:bg-transparent"
          >
            <td class="py-3 px-2">
              <p class="font-medium text-gray-800">{{ item.product_name }}</p>
            </td>
            <td class="py-3 px-2 text-center text-gray-600">
              {{ item.quantity }}
            </td>
            <td class="py-3 px-2 text-right text-gray-600">
              ฿{{ formatCurrency(item.product_price) }}
            </td>
            <td class="py-3 px-2 text-right font-medium text-gray-800">
              ฿{{ formatCurrency(item.subtotal) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <div class="border-t-2 border-gray-200 pt-4">
        <div class="flex justify-end">
          <div class="w-72 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ยอดสินค้า</span>
              <span>฿{{ formatCurrency(order.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ค่าจัดส่ง</span>
              <span>{{
                order.delivery_fee === 0
                  ? "ฟรี"
                  : "฿" + formatCurrency(order.delivery_fee)
              }}</span>
            </div>
            <div
              v-if="order.discount > 0"
              class="flex justify-between text-sm text-green-600"
            >
              <span>ส่วนลด</span>
              <span>-฿{{ formatCurrency(order.discount) }}</span>
            </div>
            <div
              class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"
            >
              <span>ยอดรวมทั้งสิ้น</span>
              <span class="text-green-600"
                >฿{{ formatCurrency(order.total) }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="order.notes"
        class="mt-6 p-4 bg-yellow-50 rounded-lg print:bg-yellow-100"
      >
        <p class="text-sm font-medium text-yellow-800">หมายเหตุ:</p>
        <p class="text-sm text-yellow-700">{{ order.notes }}</p>
      </div>

      <!-- Footer -->
      <div
        class="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500"
      >
        <p>{{ storeInfo.footerMessage }}</p>
        <p v-if="storeInfo.footerNote" class="mt-2 text-xs text-gray-400">
          {{ storeInfo.footerNote }}
        </p>
        <p class="mt-1">หากมีข้อสงสัย กรุณาติดต่อ {{ storeInfo.phone }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .invoice-container {
    margin: 0;
    padding: 0;
  }
  .invoice-content {
    box-shadow: none;
  }
}
</style>
