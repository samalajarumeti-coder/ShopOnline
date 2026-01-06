<template>
  <div class="admin-challenges">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Challenges Management</h1>
        <p class="text-gray-600">จัดการภารกิจรับคะแนน</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + สร้างภารกิจใหม่
      </button>
    </div>

    <!-- Challenges Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div
        v-for="challenge in challenges"
        :key="challenge.id"
        class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">{{ challenge.name }}</h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ challenge.description }}
            </p>
          </div>
          <span
            :class="
              challenge.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            "
            class="px-2 py-1 text-xs rounded-full ml-2"
          >
            {{ challenge.is_active ? "Active" : "Inactive" }}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">ประเภท:</span>
            <span class="font-medium">{{
              getChallengeTypeLabel(challenge.challenge_type)
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">เป้าหมาย:</span>
            <span class="font-medium">{{ challenge.target_value }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">รางวัล:</span>
            <span class="font-medium text-blue-600"
              >{{ challenge.reward_points }} คะแนน</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">ทำสำเร็จ:</span>
            <span class="font-medium"
              >{{ challenge.completion_count || 0 }} ครั้ง</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Completion Rate:</span>
            <span class="font-medium"
              >{{ challenge.completion_rate || 0 }}%</span
            >
          </div>
        </div>

        <div class="flex gap-2 mt-4 pt-4 border-t">
          <button
            @click="editChallenge(challenge)"
            class="flex-1 text-sm text-blue-600 hover:text-blue-700"
          >
            แก้ไข
          </button>
          <button
            @click="toggleChallengeStatus(challenge)"
            class="flex-1 text-sm text-gray-600 hover:text-gray-700"
          >
            {{ challenge.is_active ? "ปิด" : "เปิด" }}
          </button>
        </div>
      </div>
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
            {{ editingChallenge ? "แก้ไขภารกิจ" : "สร้างภารกิจใหม่" }}
          </h2>

          <form @submit.prevent="saveChallenge" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อภารกิจ (ไทย)</label
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
                >ชื่อภารกิจ (English)</label
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
                  >ประเภทภารกิจ</label
                >
                <select
                  v-model="form.challenge_type"
                  required
                  class="input-field"
                >
                  <option value="purchase_count">ซื้อครบ X ครั้ง</option>
                  <option value="purchase_amount">ซื้อครบ X บาท</option>
                  <option value="category_purchase">ซื้อในหมวดหมู่</option>
                  <option value="streak">ซื้อติดต่อกัน X วัน</option>
                  <option value="referral">ชวนเพื่อน X คน</option>
                  <option value="review">รีวิวสินค้า X ชิ้น</option>
                  <option value="share">แชร์สินค้า X ครั้ง</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >เป้าหมาย</label
                >
                <input
                  v-model.number="form.target_value"
                  type="number"
                  required
                  min="1"
                  class="input-field"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >คะแนนรางวัล</label
              >
              <input
                v-model.number="form.reward_points"
                type="number"
                required
                min="1"
                class="input-field"
              />
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="form.is_recurring"
                type="checkbox"
                id="is_recurring"
                class="rounded"
              />
              <label
                for="is_recurring"
                class="text-sm font-medium text-gray-700"
                >ทำซ้ำได้</label
              >
            </div>

            <div v-if="form.is_recurring">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >รอบการทำซ้ำ</label
              >
              <select v-model="form.recurrence_period" class="input-field">
                <option value="daily">รายวัน</option>
                <option value="weekly">รายสัปดาห์</option>
                <option value="monthly">รายเดือน</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >วันเริ่มต้น (optional)</label
                >
                <input
                  v-model="form.start_date"
                  type="date"
                  class="input-field"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >วันสิ้นสุด (optional)</label
                >
                <input
                  v-model="form.end_date"
                  type="date"
                  class="input-field"
                />
              </div>
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

const challenges = ref([]);
const showCreateModal = ref(false);
const editingChallenge = ref(null);
const form = ref({
  name: "",
  name_en: "",
  description: "",
  challenge_type: "purchase_count",
  target_value: 5,
  reward_points: 100,
  is_recurring: false,
  recurrence_period: "monthly",
  start_date: "",
  end_date: "",
  is_active: true,
});

const loadChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from("loyalty_challenges")
      .select(
        `
        *,
        progress:user_challenge_progress(count, completed)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    challenges.value =
      data?.map((c) => {
        const totalParticipants = c.progress?.length || 0;
        const completedCount =
          c.progress?.filter((p) => p.completed).length || 0;
        return {
          ...c,
          completion_count: completedCount,
          completion_rate:
            totalParticipants > 0
              ? Math.round((completedCount / totalParticipants) * 100)
              : 0,
        };
      }) || [];
  } catch (error) {
    console.error("Error loading challenges:", error);
  }
};

const getChallengeTypeLabel = (type) => {
  const labels = {
    purchase_count: "ซื้อครบ X ครั้ง",
    purchase_amount: "ซื้อครบ X บาท",
    category_purchase: "ซื้อในหมวดหมู่",
    streak: "ซื้อติดต่อกัน",
    referral: "ชวนเพื่อน",
    review: "รีวิวสินค้า",
    share: "แชร์สินค้า",
  };
  return labels[type] || type;
};

const editChallenge = (challenge) => {
  editingChallenge.value = challenge;
  form.value = {
    name: challenge.name,
    name_en: challenge.name_en || "",
    description: challenge.description || "",
    challenge_type: challenge.challenge_type,
    target_value: challenge.target_value,
    reward_points: challenge.reward_points,
    is_recurring: challenge.is_recurring,
    recurrence_period: challenge.recurrence_period || "monthly",
    start_date: challenge.start_date ? challenge.start_date.split("T")[0] : "",
    end_date: challenge.end_date ? challenge.end_date.split("T")[0] : "",
    is_active: challenge.is_active,
  };
  showCreateModal.value = true;
};

const saveChallenge = async () => {
  try {
    const challengeData = {
      name: form.value.name,
      name_en: form.value.name_en || null,
      description: form.value.description || null,
      challenge_type: form.value.challenge_type,
      target_value: form.value.target_value,
      reward_points: form.value.reward_points,
      is_recurring: form.value.is_recurring,
      recurrence_period: form.value.is_recurring
        ? form.value.recurrence_period
        : null,
      start_date: form.value.start_date || null,
      end_date: form.value.end_date || null,
      is_active: form.value.is_active,
    };

    if (editingChallenge.value) {
      const { error } = await supabase
        .from("loyalty_challenges")
        .update(challengeData)
        .eq("id", editingChallenge.value.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("loyalty_challenges")
        .insert(challengeData);

      if (error) throw error;
    }

    await loadChallenges();
    closeModal();
  } catch (error) {
    console.error("Error saving challenge:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};

const toggleChallengeStatus = async (challenge) => {
  try {
    const { error } = await supabase
      .from("loyalty_challenges")
      .update({ is_active: !challenge.is_active })
      .eq("id", challenge.id);

    if (error) throw error;
    await loadChallenges();
  } catch (error) {
    console.error("Error toggling challenge status:", error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingChallenge.value = null;
  form.value = {
    name: "",
    name_en: "",
    description: "",
    challenge_type: "purchase_count",
    target_value: 5,
    reward_points: 100,
    is_recurring: false,
    recurrence_period: "monthly",
    start_date: "",
    end_date: "",
    is_active: true,
  };
};

onMounted(() => {
  loadChallenges();
});
</script>
