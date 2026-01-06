<template>
  <div class="admin-loyalty">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Loyalty Program</h1>
      <p class="text-gray-600">จัดการระบบสะสมคะแนนและสมาชิก</p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">สมาชิกทั้งหมด</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ stats.totalMembers?.toLocaleString() || 0 }}
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Active (90 วัน)</div>
        <div class="text-2xl font-bold text-green-600">
          {{ stats.activeMembers?.toLocaleString() || 0 }}
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">คะแนนที่ออก</div>
        <div class="text-2xl font-bold text-blue-600">
          {{ stats.pointsIssued?.toLocaleString() || 0 }}
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm text-gray-600">Redemption Rate</div>
        <div class="text-2xl font-bold text-purple-600">
          {{ stats.redemptionRate || 0 }}%
        </div>
      </div>
    </div>

    <!-- Tier Distribution -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-lg font-bold mb-4">การกระจายตัวของระดับสมาชิก</h2>
      <div class="space-y-3">
        <div
          v-for="tier in tierDistribution"
          :key="tier.id"
          class="flex items-center gap-4"
        >
          <div class="w-32 font-medium">{{ tier.name }}</div>
          <div class="flex-1">
            <div class="bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                class="h-full flex items-center justify-end px-2 text-xs text-white font-medium"
                :style="{
                  width: tier.percentage + '%',
                  backgroundColor: tier.badge_color || '#94a3b8',
                }"
              >
                {{ tier.percentage }}%
              </div>
            </div>
          </div>
          <div class="w-24 text-right text-sm text-gray-600">
            {{ tier.member_count?.toLocaleString() || 0 }} คน
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">ธุรกรรมล่าสุด</h2>
        <button
          @click="loadTransactions"
          class="text-sm text-blue-600 hover:text-blue-700"
        >
          รีเฟรช
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                วันที่
              </th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                ผู้ใช้
              </th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                ประเภท
              </th>
              <th
                class="px-4 py-2 text-right text-xs font-medium text-gray-500"
              >
                คะแนน
              </th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="tx in recentTransactions" :key="tx.id">
              <td class="px-4 py-3 text-sm">{{ formatDate(tx.created_at) }}</td>
              <td class="px-4 py-3 text-sm">{{ tx.user_email }}</td>
              <td class="px-4 py-3">
                <span
                  :class="getTypeClass(tx.type)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ getTypeLabel(tx.type) }}
                </span>
              </td>
              <td
                class="px-4 py-3 text-sm text-right font-medium"
                :class="tx.points > 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ tx.points > 0 ? "+" : "" }}{{ tx.points }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ tx.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-4">
      <router-link to="/admin/loyalty/rewards" class="btn-primary">
        จัดการรางวัล
      </router-link>
      <router-link to="/admin/loyalty/challenges" class="btn-secondary">
        จัดการภารกิจ
      </router-link>
      <button @click="exportReport" class="btn-secondary">Export รายงาน</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabase";

const stats = ref({});
const tierDistribution = ref([]);
const recentTransactions = ref([]);

const loadStats = async () => {
  try {
    const { data, error } = await supabase.rpc("get_loyalty_stats");
    if (error) throw error;
    stats.value = data || {};
  } catch (error) {
    // Fallback to manual query
    const { data } = await supabase
      .from("user_loyalty")
      .select("id, last_purchase_date, total_points, available_points");

    const activeCount =
      data?.filter((u) => {
        const lastPurchase = new Date(u.last_purchase_date);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return lastPurchase >= ninetyDaysAgo;
      }).length || 0;

    stats.value = {
      totalMembers: data?.length || 0,
      activeMembers: activeCount,
      pointsIssued:
        data?.reduce((sum, u) => sum + (u.total_points || 0), 0) || 0,
      redemptionRate: 0,
    };
  }
};

const loadTierDistribution = async () => {
  try {
    const { data, error } = await supabase
      .from("loyalty_tiers")
      .select(
        `
        *,
        members:user_loyalty(count)
      `
      )
      .order("level");

    if (error) throw error;

    const total =
      data?.reduce((sum, tier) => sum + (tier.members?.[0]?.count || 0), 0) ||
      1;

    tierDistribution.value =
      data?.map((tier) => ({
        ...tier,
        member_count: tier.members?.[0]?.count || 0,
        percentage: Math.round(((tier.members?.[0]?.count || 0) / total) * 100),
      })) || [];
  } catch (error) {
    console.error("Error loading tier distribution:", error);
  }
};

const loadTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .select(
        `
        *,
        user:profiles!points_transactions_user_id_fkey(email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    recentTransactions.value =
      data?.map((tx) => ({
        ...tx,
        user_email: tx.user?.email || "N/A",
      })) || [];
  } catch (error) {
    console.error("Error loading transactions:", error);
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeLabel = (type) => {
  const labels = {
    earn: "รับคะแนน",
    redeem: "แลกรางวัล",
    expire: "หมดอายุ",
    bonus: "โบนัส",
    refund: "คืนคะแนน",
  };
  return labels[type] || type;
};

const getTypeClass = (type) => {
  const classes = {
    earn: "bg-green-100 text-green-800",
    redeem: "bg-blue-100 text-blue-800",
    expire: "bg-gray-100 text-gray-800",
    bonus: "bg-purple-100 text-purple-800",
    refund: "bg-yellow-100 text-yellow-800",
  };
  return classes[type] || "bg-gray-100 text-gray-800";
};

const exportReport = () => {
  alert("Export functionality coming soon!");
};

onMounted(() => {
  loadStats();
  loadTierDistribution();
  loadTransactions();
});
</script>
