/* Path: /profile */
<script setup>
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useOrdersStore } from "../stores/orders";
import { useWishlistStore } from "../stores/wishlist";
import { usePullToRefresh } from "../composables/usePullToRefresh";
import SkeletonLoader from "../components/SkeletonLoader.vue";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Gift,
  Package,
  Heart,
  Clock,
  Settings,
  Shield,
  FileText,
  Star,
  Loader2,
  Users,
  CalendarClock,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();
const ordersStore = useOrdersStore();
const wishlistStore = useWishlistStore();

const isLoadingData = ref(false);

// Order statistics
const orderStats = computed(() => {
  const orders = ordersStore.orders;
  return {
    active: orders.filter((o) =>
      ["pending", "confirmed", "preparing", "delivering"].includes(o.status)
    ).length,
    completed: orders.filter((o) => o.status === "completed").length,
    total: orders.length,
  };
});

// Wishlist count
const wishlistCount = computed(() => wishlistStore.wishlistCount);

// Menu sections with grouping
const menuSections = computed(() => [
  {
    title: "การซื้อของฉัน",
    items: [
      {
        icon: Package,
        label: "ประวัติการสั่งซื้อ",
        path: "/customer/orders",
        badge: orderStats.value.active,
        description: `${orderStats.value.total} รายการ`,
      },
      {
        icon: CalendarClock,
        label: "สั่งซื้ออัตโนมัติ",
        path: "/customer/subscriptions",
        description: "ตั้งค่าสั่งซื้อประจำ",
      },
      {
        icon: Heart,
        label: "รายการโปรด",
        path: "/customer/wishlist",
        badge: wishlistCount.value,
        description: `${wishlistCount.value} สินค้า`,
      },
      {
        icon: Gift,
        label: "คูปองของฉัน",
        path: "/customer/coupons",
        description: "ดูคูปองทั้งหมด",
      },
    ],
  },
  {
    title: "รางวัลและสิทธิพิเศษ",
    items: [
      {
        icon: Star,
        label: "ความสำเร็จ",
        path: "/customer/achievements",
        description: "ปลดล็อกความสำเร็จ",
      },
      {
        icon: Users,
        label: "แนะนำเพื่อน",
        path: "/customer/referral",
        description: "รับคะแนนพิเศษ",
      },
    ],
  },
  {
    title: "ข้อมูลส่วนตัว",
    items: [
      {
        icon: User,
        label: "แก้ไขโปรไฟล์",
        path: "/customer/edit-profile",
        description: "ชื่อ, อีเมล, เบอร์โทร",
      },
      {
        icon: MapPin,
        label: "ที่อยู่จัดส่ง",
        path: "/customer/addresses",
        description: "จัดการที่อยู่",
      },
      {
        icon: CreditCard,
        label: "วิธีการชำระเงิน",
        path: "/customer/payment",
        description: "บัตรเครดิต/เดบิต",
      },
    ],
  },
  {
    title: "การตั้งค่า",
    items: [
      {
        icon: Bell,
        label: "การแจ้งเตือน",
        path: "/customer/notifications",
        description: "จัดการการแจ้งเตือน",
      },
      {
        icon: Shield,
        label: "ความเป็นส่วนตัว",
        path: "/customer/privacy",
        description: "นโยบายและความปลอดภัย",
      },
      {
        icon: Settings,
        label: "ตั้งค่าทั่วไป",
        path: "/customer/settings",
        description: "ภาษา, ธีม",
      },
    ],
  },
  {
    title: "ช่วยเหลือและข้อมูล",
    items: [
      {
        icon: HelpCircle,
        label: "ศูนย์ช่วยเหลือ",
        path: "/customer/help",
        description: "คำถามที่พบบ่อย",
      },
      {
        icon: FileText,
        label: "เงื่อนไขการใช้งาน",
        path: "/customer/terms",
        description: "ข้อกำหนดและเงื่อนไข",
      },
    ],
  },
]);

const handleLogout = async () => {
  if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
    try {
      await authStore.signOut();
      router.push("/customer");
    } catch (error) {
      console.error("Logout error:", error);
      alert("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  }
};

const loadUserData = async () => {
  if (!authStore.isLoggedIn) return;

  isLoadingData.value = true;
  try {
    await Promise.all([
      authStore.fetchProfile(),
      ordersStore.fetchOrders(),
      wishlistStore.fetchWishlistProducts(),
    ]);
  } catch (error) {
    console.error("Error loading user data:", error);
  } finally {
    isLoadingData.value = false;
  }
};

onMounted(() => {
  loadUserData();
});

// Pull to refresh
const { isRefreshing, containerRef } = usePullToRefresh(loadUserData);
</script>

<template>
  <div ref="containerRef" class="bg-[#f3f4f6] min-h-screen pb-20">
    <!-- Pull to Refresh Indicator -->
    <div
      v-if="isRefreshing"
      class="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4"
    >
      <div
        class="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
      >
        <Loader2 class="w-4 h-4 text-[#007f3e] animate-spin" />
        <span class="text-sm text-gray-700">กำลังอัปเดต...</span>
      </div>
    </div>

    <!-- Profile Header -->
    <div
      class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] px-4 pt-6 pb-8 text-white relative overflow-hidden"
    >
      <!-- Decorative circles -->
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"
      ></div>

      <!-- Logged In -->
      <template v-if="authStore.isLoggedIn">
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/20"
            >
              <User class="w-10 h-10" />
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-xl mb-1">
                {{ authStore.profile?.full_name || "สมาชิก" }}
              </h2>
              <p class="text-sm opacity-90">{{ authStore.user?.email }}</p>
              <div class="flex items-center gap-1 mt-1">
                <Star class="w-4 h-4 fill-yellow-300 text-yellow-300" />
                <span class="text-xs opacity-90">สมาชิกทั่วไป</span>
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-3 gap-3">
            <!-- Points Card -->
            <div
              class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-bold">
                {{ authStore.profile?.points || 0 }}
              </p>
              <p class="text-xs opacity-90 mt-1">คะแนน</p>
            </div>

            <!-- Orders Card -->
            <div
              class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-bold">{{ orderStats.total }}</p>
              <p class="text-xs opacity-90 mt-1">คำสั่งซื้อ</p>
            </div>

            <!-- Wishlist Card -->
            <div
              class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-bold">{{ wishlistCount }}</p>
              <p class="text-xs opacity-90 mt-1">รายการโปรด</p>
            </div>
          </div>

          <!-- Rewards Banner -->
          <button
            @click="router.push('/customer/rewards')"
            class="w-full mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between hover:bg-white/25 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Gift class="w-6 h-6" />
              <div class="text-left">
                <p class="font-medium">แลกของรางวัล</p>
                <p class="text-xs opacity-90">ใช้คะแนนแลกรับสิทธิพิเศษ</p>
              </div>
            </div>
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </template>

      <!-- Not Logged In -->
      <template v-else>
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/20"
            >
              <User class="w-10 h-10" />
            </div>
            <div>
              <h2 class="font-bold text-xl mb-1">ยินดีต้อนรับ</h2>
              <p class="text-sm opacity-90">เข้าสู่ระบบเพื่อรับสิทธิพิเศษ</p>
            </div>
          </div>

          <div class="flex gap-3">
            <router-link
              to="/customer/login"
              class="flex-1 bg-white text-[#007f3e] py-3.5 rounded-xl font-medium text-center hover:bg-gray-50 transition-colors shadow-lg"
            >
              เข้าสู่ระบบ
            </router-link>
            <router-link
              to="/customer/register"
              class="flex-1 bg-white/20 backdrop-blur-sm text-white py-3.5 rounded-xl font-medium text-center hover:bg-white/25 transition-colors"
            >
              สมัครสมาชิก
            </router-link>
          </div>
        </div>
      </template>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingData" class="px-4 py-4 space-y-4">
      <!-- Section Skeleton -->
      <div v-for="i in 4" :key="i" class="space-y-2">
        <SkeletonLoader type="generic" class="h-4 w-32 rounded" />
        <div class="bg-white rounded-xl p-4 space-y-3">
          <div v-for="j in 3" :key="j" class="flex items-center gap-4">
            <SkeletonLoader type="generic" class="w-10 h-10 rounded-full" />
            <div class="flex-1 space-y-2">
              <SkeletonLoader type="generic" class="h-4 w-3/4 rounded" />
              <SkeletonLoader type="generic" class="h-3 w-1/2 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu Sections -->
    <div v-else class="px-4 py-4 space-y-4">
      <div
        v-for="section in menuSections"
        :key="section.title"
        class="space-y-2"
      >
        <!-- Section Title -->
        <h3 class="text-sm font-semibold text-gray-500 px-2">
          {{ section.title }}
        </h3>

        <!-- Section Items -->
        <div class="bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            v-for="(item, index) in section.items"
            :key="item.label"
            @click="
              authStore.isLoggedIn
                ? router.push(item.path)
                : router.push('/customer/login')
            "
            class="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            :class="{ 'border-t border-gray-100': index > 0 }"
          >
            <!-- Icon -->
            <div
              class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <component :is="item.icon" class="w-5 h-5 text-gray-600" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900">{{ item.label }}</p>
              <p class="text-sm text-gray-500 truncate">
                {{ item.description }}
              </p>
            </div>

            <!-- Badge & Arrow -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="item.badge > 0"
                class="bg-[#007f3e] text-white text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {{ item.badge }}
              </span>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>

      <!-- Logout Button -->
      <button
        v-if="authStore.isLoggedIn"
        @click="handleLogout"
        class="w-full flex items-center justify-center gap-2 py-4 text-red-500 bg-white rounded-xl shadow-sm hover:bg-red-50 active:bg-red-100 transition-colors font-medium"
      >
        <LogOut class="w-5 h-5" />
        <span>ออกจากระบบ</span>
      </button>

      <!-- App Version -->
      <div class="text-center py-4">
        <p class="text-xs text-gray-400">เวอร์ชัน 1.0.0</p>
        <p class="text-xs text-gray-400 mt-1">© 2026 7-Eleven Store</p>
      </div>
    </div>
  </div>
</template>
