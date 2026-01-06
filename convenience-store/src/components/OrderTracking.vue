<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Phone,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-vue-next";
import { useOrderTracking } from "../composables/useOrderTracking";

const props = defineProps({
  orderId: {
    type: [Number, String],
    default: null,
  },
  trackingId: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    default: null,
  },
  confirmedAt: {
    type: String,
    default: null,
  },
  preparingAt: {
    type: String,
    default: null,
  },
  deliveringAt: {
    type: String,
    default: null,
  },
  completedAt: {
    type: String,
    default: null,
  },
  cancelledAt: {
    type: String,
    default: null,
  },
  driverName: {
    type: String,
    default: null,
  },
  driverPhone: {
    type: String,
    default: null,
  },
  estimatedDelivery: {
    type: String,
    default: null,
  },
});

const {
  getTrackingHistory,
  formatTrackingId,
  getStatusLabel,
  getStatusColor,
  getEstimatedDelivery,
  formatTimestamp,
  copyTrackingId,
} = useOrderTracking();

const trackingHistory = ref([]);
const showHistory = ref(false);
const copied = ref(false);

const steps = computed(() => {
  const baseSteps = [
    {
      key: "pending",
      label: "รอยืนยัน",
      icon: Clock,
      timestamp: props.createdAt,
    },
    {
      key: "confirmed",
      label: "ยืนยันแล้ว",
      icon: CheckCircle,
      timestamp: props.confirmedAt,
    },
    {
      key: "preparing",
      label: "กำลังเตรียม",
      icon: Package,
      timestamp: props.preparingAt,
    },
    {
      key: "delivering",
      label: "กำลังจัดส่ง",
      icon: Truck,
      timestamp: props.deliveringAt,
    },
    {
      key: "completed",
      label: "สำเร็จ",
      icon: CheckCircle,
      timestamp: props.completedAt,
    },
  ];

  if (props.status === "cancelled") {
    return [
      {
        key: "cancelled",
        label: "ยกเลิกแล้ว",
        icon: XCircle,
        timestamp: props.cancelledAt,
      },
    ];
  }

  return baseSteps;
});

const currentStepIndex = computed(() => {
  const statusOrder = [
    "pending",
    "confirmed",
    "preparing",
    "delivering",
    "completed",
  ];
  return statusOrder.indexOf(props.status);
});

const estimatedTime = computed(() => {
  if (props.estimatedDelivery) {
    return formatTimestamp(props.estimatedDelivery);
  }
  return getEstimatedDelivery(props.createdAt, props.status)?.formatted;
});

const statusColors = computed(() => getStatusColor(props.status));

const isStepCompleted = (index) => {
  if (props.status === "cancelled") return false;
  return index <= currentStepIndex.value;
};

const isStepActive = (index) => {
  if (props.status === "cancelled") return false;
  return index === currentStepIndex.value;
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleCopyTracking = async () => {
  if (props.trackingId) {
    const success = await copyTrackingId(props.trackingId);
    if (success) {
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    }
  }
};

const loadHistory = async () => {
  if (props.orderId && trackingHistory.value.length === 0) {
    trackingHistory.value = await getTrackingHistory(props.orderId);
  }
  showHistory.value = !showHistory.value;
};

onMounted(async () => {
  if (props.orderId) {
    trackingHistory.value = await getTrackingHistory(props.orderId);
  }
});
</script>

<template>
  <div class="py-4">
    <!-- Tracking ID Header -->
    <div
      v-if="trackingId"
      class="mb-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between"
    >
      <div>
        <p class="text-xs text-gray-500">หมายเลขติดตาม</p>
        <p class="font-mono font-bold text-gray-800">
          {{ formatTrackingId(trackingId) }}
        </p>
      </div>
      <button
        @click="handleCopyTracking"
        class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        :class="copied ? 'text-green-600' : 'text-gray-500'"
      >
        <Copy class="w-5 h-5" />
      </button>
    </div>

    <!-- Estimated Delivery -->
    <div
      v-if="estimatedTime && status !== 'completed' && status !== 'cancelled'"
      class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl"
    >
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5 text-orange-600" />
        <div>
          <p class="text-sm font-medium text-orange-800">เวลาจัดส่งโดยประมาณ</p>
          <p class="text-orange-600">{{ estimatedTime }}</p>
        </div>
      </div>
    </div>

    <!-- Driver Info -->
    <div
      v-if="driverName && status === 'delivering'"
      class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
    >
      <p class="text-xs text-blue-600 mb-2">ข้อมูลผู้จัดส่ง</p>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"
          >
            <User class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="font-medium text-gray-800">{{ driverName }}</p>
            <p v-if="driverPhone" class="text-sm text-gray-500">
              {{ driverPhone }}
            </p>
          </div>
        </div>
        <a
          v-if="driverPhone"
          :href="`tel:${driverPhone}`"
          class="p-2 bg-blue-600 text-white rounded-full"
        >
          <Phone class="w-5 h-5" />
        </a>
      </div>
    </div>

    <!-- Cancelled Status -->
    <div v-if="status === 'cancelled'" class="flex flex-col items-center py-8">
      <div
        class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3"
      >
        <XCircle class="w-8 h-8 text-red-500" />
      </div>
      <p class="font-semibold text-gray-900 mb-1">คำสั่งซื้อถูกยกเลิก</p>
      <p class="text-sm text-gray-500">{{ formatTime(cancelledAt) }}</p>
    </div>

    <!-- Normal Status Timeline -->
    <div v-else class="space-y-4">
      <div v-for="(step, index) in steps" :key="step.key" class="flex gap-4">
        <!-- Timeline -->
        <div class="flex flex-col items-center">
          <!-- Icon -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            :class="
              isStepCompleted(index)
                ? 'bg-[#007f3e] text-white'
                : isStepActive(index)
                ? 'bg-[#007f3e]/20 text-[#007f3e] ring-4 ring-[#007f3e]/10'
                : 'bg-gray-200 text-gray-400'
            "
          >
            <component :is="step.icon" class="w-5 h-5" />
          </div>

          <!-- Line -->
          <div
            v-if="index < steps.length - 1"
            class="w-0.5 h-12 transition-colors"
            :class="isStepCompleted(index) ? 'bg-[#007f3e]' : 'bg-gray-200'"
          ></div>
        </div>

        <!-- Content -->
        <div class="flex-1 pb-4">
          <p
            class="font-medium transition-colors"
            :class="
              isStepCompleted(index) || isStepActive(index)
                ? 'text-gray-900'
                : 'text-gray-400'
            "
          >
            {{ step.label }}
          </p>
          <p v-if="step.timestamp" class="text-sm text-gray-500 mt-1">
            {{ formatTime(step.timestamp) }}
          </p>
          <p
            v-else-if="isStepActive(index)"
            class="text-sm text-[#007f3e] mt-1"
          >
            กำลังดำเนินการ...
          </p>
        </div>
      </div>
    </div>

    <!-- Tracking History Toggle -->
    <div v-if="trackingHistory.length > 0" class="mt-4 border-t pt-4">
      <button
        @click="loadHistory"
        class="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800"
      >
        <span>ประวัติการติดตาม ({{ trackingHistory.length }})</span>
        <ChevronDown v-if="!showHistory" class="w-4 h-4" />
        <ChevronUp v-else class="w-4 h-4" />
      </button>

      <!-- History List -->
      <div v-if="showHistory" class="mt-3 space-y-2">
        <div
          v-for="item in trackingHistory"
          :key="item.id"
          class="p-2 bg-gray-50 rounded-lg text-sm"
        >
          <div class="flex items-center justify-between">
            <span
              class="px-2 py-0.5 rounded-full text-xs"
              :class="[
                getStatusColor(item.status).bg,
                getStatusColor(item.status).text,
              ]"
            >
              {{ getStatusLabel(item.status) }}
            </span>
            <span class="text-xs text-gray-400">
              {{ formatTime(item.created_at) }}
            </span>
          </div>
          <p
            v-if="item.location"
            class="text-gray-600 mt-1 flex items-center gap-1"
          >
            <MapPin class="w-3 h-3" />
            {{ item.location }}
          </p>
          <p v-if="item.notes" class="text-gray-500 mt-1">{{ item.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
