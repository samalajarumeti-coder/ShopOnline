<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft,
  Copy,
  Share2,
  Users,
  Gift,
  CheckCircle,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const referralCode = ref("");
const referrals = ref([]);
const loading = ref(false);
const copied = ref(false);

const referralLink = computed(() => {
  if (!referralCode.value) return "";
  return `${window.location.origin}/customer/register?ref=${referralCode.value}`;
});

const totalReferrals = computed(() => referrals.value.length);
const completedReferrals = computed(
  () => referrals.value.filter((r) => r.status === "completed").length
);
const totalEarned = computed(() =>
  referrals.value
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.reward_points || 0), 0)
);

const loadReferralData = async () => {
  loading.value = true;
  try {
    // Get referral code from profile
    referralCode.value = authStore.profile?.referral_code || "";

    // Fetch referrals
    const { data, error } = await supabase
      .from("referrals")
      .select(
        `
        *,
        referred:profiles!referrals_referred_id_fkey(full_name, email)
      `
      )
      .eq("referrer_id", authStore.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    referrals.value = data || [];
  } catch (error) {
    console.error("Error loading referral data:", error);
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
};

const shareReferral = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "แนะนำเพื่อนมาใช้ 7-Eleven Store",
        text: `ใช้โค้ดของฉัน ${referralCode.value} เพื่อรับคะแนนพิเศษ!`,
        url: referralLink.value,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  } else {
    copyToClipboard();
  }
};

onMounted(() => {
  loadReferralData();
});
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
        <h1 class="text-lg font-semibold text-gray-900">แนะนำเพื่อน</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 text-[#007f3e] animate-spin" />
    </div>

    <div v-else class="p-4 space-y-4">
      <!-- Hero Card -->
      <div
        class="bg-gradient-to-br from-[#007f3e] to-[#005a2d] rounded-xl p-6 text-white"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Gift class="w-8 h-8" />
          </div>
          <div>
            <h2 class="text-xl font-bold">แนะนำเพื่อน รับคะแนน</h2>
            <p class="text-sm opacity-90">คุณและเพื่อนได้รับคะแนนทั้งคู่</p>
          </div>
        </div>

        <!-- Rewards -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p class="text-2xl font-bold">150</p>
            <p class="text-xs opacity-90">คะแนนสำหรับคุณ</p>
          </div>
          <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p class="text-2xl font-bold">50</p>
            <p class="text-xs opacity-90">คะแนนสำหรับเพื่อน</p>
          </div>
        </div>

        <!-- Referral Code -->
        <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <p class="text-xs opacity-90 mb-2">โค้ดแนะนำของคุณ</p>
          <div class="flex items-center justify-between gap-3">
            <p class="text-2xl font-bold tracking-wider">{{ referralCode }}</p>
            <button
              @click="copyToClipboard"
              class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <CheckCircle v-if="copied" class="w-5 h-5" />
              <Copy v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Share Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="copyToClipboard"
          class="flex items-center justify-center gap-2 bg-white py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Copy class="w-5 h-5 text-gray-600" />
          <span class="font-medium text-gray-900">
            {{ copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์" }}
          </span>
        </button>
        <button
          @click="shareReferral"
          class="flex items-center justify-center gap-2 bg-[#007f3e] text-white py-3 rounded-xl shadow-sm hover:bg-[#006633] transition-colors"
        >
          <Share2 class="w-5 h-5" />
          <span class="font-medium">แชร์</span>
        </button>
      </div>

      <!-- Stats -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-4">สถิติการแนะนำ</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div
              class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2"
            >
              <Users class="w-6 h-6 text-blue-600" />
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ totalReferrals }}</p>
            <p class="text-xs text-gray-500">ทั้งหมด</p>
          </div>
          <div class="text-center">
            <div
              class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"
            >
              <CheckCircle class="w-6 h-6 text-green-600" />
            </div>
            <p class="text-2xl font-bold text-gray-900">
              {{ completedReferrals }}
            </p>
            <p class="text-xs text-gray-500">สำเร็จ</p>
          </div>
          <div class="text-center">
            <div
              class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2"
            >
              <Gift class="w-6 h-6 text-orange-600" />
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ totalEarned }}</p>
            <p class="text-xs text-gray-500">คะแนน</p>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3">วิธีการแนะนำเพื่อน</h3>
        <div class="space-y-3">
          <div class="flex gap-3">
            <div
              class="w-8 h-8 bg-[#007f3e] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold"
            >
              1
            </div>
            <div>
              <p class="font-medium text-gray-900">แชร์โค้ดของคุณ</p>
              <p class="text-sm text-gray-600">
                ส่งโค้ดหรือลิงก์ให้เพื่อนของคุณ
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <div
              class="w-8 h-8 bg-[#007f3e] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold"
            >
              2
            </div>
            <div>
              <p class="font-medium text-gray-900">เพื่อนสมัครสมาชิก</p>
              <p class="text-sm text-gray-600">เพื่อนใช้โค้ดของคุณตอนสมัคร</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div
              class="w-8 h-8 bg-[#007f3e] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold"
            >
              3
            </div>
            <div>
              <p class="font-medium text-gray-900">รับคะแนนทั้งคู่</p>
              <p class="text-sm text-gray-600">
                คุณได้ 150 คะแนน เพื่อนได้ 50 คะแนน
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Referral List -->
      <div
        v-if="referrals.length > 0"
        class="bg-white rounded-xl p-4 shadow-sm"
      >
        <h3 class="font-semibold text-gray-900 mb-3">เพื่อนที่แนะนำ</h3>
        <div class="space-y-3">
          <div
            v-for="referral in referrals"
            :key="referral.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <Users class="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ referral.referred?.full_name || "ผู้ใช้" }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    new Date(referral.created_at).toLocaleDateString("th-TH")
                  }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span
                v-if="referral.status === 'completed'"
                class="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded"
              >
                <CheckCircle class="w-3 h-3" />
                +{{ referral.reward_points }}
              </span>
              <span
                v-else
                class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
              >
                รอดำเนินการ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
