<template>
  <div class="admin-rewards">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Rewards Management</h1>
        <p class="text-gray-600">จัดการรางวัลที่แลกได้</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + สร้างรางวัลใหม่
      </button>
    </div>

    <!-- Rewards Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">
              รางวัล
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500">
              คะแนน
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">
              ประเภท
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500">
              Stock
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500">
              แลกแล้ว
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500">
              สถานะ
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="reward in rewards"
            :key="reward.id"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900">{{ reward.name }}</div>
              <div class="text-sm text-gray-500">{{ reward.description }}</div>
            </td>
            <td class="px-4 py-3 text-right font-medium text-blue-600">
              {{ reward.points_cost?.toLocaleString() }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
              >
                {{ getRewardTypeLabel(reward.reward_type) }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              {{ reward.stock !== null ? reward.stock : "∞" }}
            </td>
            <td class="px-4 py-3 text-right">
              {{ reward.redeemed_count || 0 }}
            </td>
            <td class="px-4 py-3 text-center">
              <span
                :class="
                  reward.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                "
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ reward.is_active ? "Active" : "Inactive" }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button
                @click="editReward(reward)"
                class="text-blue-600 hover:text-blue-700 mr-2"
              >
                แก้ไข
              </button>
              <button
                @click="toggleRewardStatus(reward)"
                class="text-gray-600 hover:text-gray-700"
              >
                {{ reward.is_active ? "ปิด" : "เปิด" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">
            {{ editingReward ? "แก้ไขรางวัล" : "สร้างรางวัลใหม่" }}
          </h2>

          <form @submit.prevent="saveReward" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อรางวัล (ไทย)</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="input-field"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อรางวัล (English)</label
              >
              <input v-model="form.name_en" type="text" class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >รายละเอียด</label
              >
              <textarea
                v-model="form.description"
                rows="3"
                class="input-field"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >คะแนนที่ใช้</label
                >
                <input
                  v-model.number="form.points_cost"
                  type="number"
                  required
                  min="1"
                  class="input-field"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ประเภทรางวัล</label
                >
                <select v-model="form.reward_type" required class="input-field">
                  <option value="discount_percentage">ส่วนลด %</option>
                  <option value="discount_fixed">ส่วนลดเงินคงที่</option>
                  <option value="free_product">สินค้าฟรี</option>
                  <option value="free_shipping">ส่งฟรี</option>
                  <option value="early_access">Early Access</option>
                  <option value="exclusive_product">สินค้าพิเศษ</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Stock (เว้นว่าง = ไม่จำกัด)</label
                >
                <input
                  v-model.number="form.stock"
                  type="number"
                  min="0"
                  class="input-field"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ระดับขั้นต่ำ</label
                >
                <select
                  v-model.number="form.min_tier_level"
                  class="input-field"
                >
                  <option :value="1">Member</option>
                  <option :value="2">Silver</option>
                  <option :value="3">Gold</option>
                  <option :value="4">Platinum</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ใช้ได้กี่วัน</label
              >
              <input
                v-model.number="form.valid_days"
                type="number"
                required
                min="1"
                class="input-field"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Reward Value (JSON)</label
              >
              <textarea
                v-model="form.reward_value_str"
                rows="3"
                class="input-field font-mono text-sm"
                placeholder='{"amount": 50}'
              ></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="form.is_active"
                type="checkbox"
                id="is_active"
                class="rounded"
              />
              <label for="is_active" class="text-sm font-medium text-gray-700"
                >เปิดใช้งาน</label
              >
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit" class="btn-primary flex-1">บันทึก</button>
              <button
                type="button"
                @click="closeModal"
                class="btn-secondary flex-1"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../lib/supabase";

const rewards = ref([]);
const showCreateModal = ref(false);
const editingReward = ref(null);
const form = ref({
  name: "",
  name_en: "",
  description: "",
  points_cost: 100,
  reward_type: "discount_fixed",
  reward_value_str: '{"amount": 50}',
  stock: null,
  min_tier_level: 1,
  valid_days: 30,
  is_active: true,
});

const loadRewards = async () => {
  try {
    const { data, error } = await supabase
      .from("loyalty_rewards")
      .select(
        `
        *,
        redeemed:user_rewards(count)
      `
      )
      .order("points_cost");

    if (error) throw error;
    rewards.value =
      data?.map((r) => ({
        ...r,
        redeemed_count: r.redeemed?.[0]?.count || 0,
      })) || [];
  } catch (error) {
    console.error("Error loading rewards:", error);
  }
};

const getRewardTypeLabel = (type) => {
  const labels = {
    discount_percentage: "ส่วนลด %",
    discount_fixed: "ส่วนลดเงิน",
    free_product: "สินค้าฟรี",
    free_shipping: "ส่งฟรี",
    early_access: "Early Access",
    exclusive_product: "สินค้าพิเศษ",
  };
  return labels[type] || type;
};

const editReward = (reward) => {
  editingReward.value = reward;
  form.value = {
    name: reward.name,
    name_en: reward.name_en || "",
    description: reward.description || "",
    points_cost: reward.points_cost,
    reward_type: reward.reward_type,
    reward_value_str: JSON.stringify(reward.reward_value),
    stock: reward.stock,
    min_tier_level: reward.min_tier_level || 1,
    valid_days: reward.valid_days || 30,
    is_active: reward.is_active,
  };
  showCreateModal.value = true;
};

const saveReward = async () => {
  try {
    const rewardData = {
      name: form.value.name,
      name_en: form.value.name_en || null,
      description: form.value.description || null,
      points_cost: form.value.points_cost,
      reward_type: form.value.reward_type,
      reward_value: JSON.parse(form.value.reward_value_str),
      stock: form.value.stock || null,
      min_tier_level: form.value.min_tier_level,
      valid_days: form.value.valid_days,
      is_active: form.value.is_active,
    };

    if (editingReward.value) {
      const { error } = await supabase
        .from("loyalty_rewards")
        .update(rewardData)
        .eq("id", editingReward.value.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("loyalty_rewards")
        .insert(rewardData);

      if (error) throw error;
    }

    await loadRewards();
    closeModal();
  } catch (error) {
    console.error("Error saving reward:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};

const toggleRewardStatus = async (reward) => {
  try {
    const { error } = await supabase
      .from("loyalty_rewards")
      .update({ is_active: !reward.is_active })
      .eq("id", reward.id);

    if (error) throw error;
    await loadRewards();
  } catch (error) {
    console.error("Error toggling reward status:", error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingReward.value = null;
  form.value = {
    name: "",
    name_en: "",
    description: "",
    points_cost: 100,
    reward_type: "discount_fixed",
    reward_value_str: '{"amount": 50}',
    stock: null,
    min_tier_level: 1,
    valid_days: 30,
    is_active: true,
  };
};

onMounted(() => {
  loadRewards();
});
</script>
