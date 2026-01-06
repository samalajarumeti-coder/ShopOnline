<script setup>
import { ref, computed } from "vue";
import { Star, ThumbsUp, MessageCircle, ChevronDown } from "lucide-vue-next";

const props = defineProps({
  productId: {
    type: Number,
    required: true,
  },
});

// Mock reviews data
const reviews = ref([
  {
    id: 1,
    user: "สมชาย ใจดี",
    rating: 5,
    comment: "สินค้าดีมาก คุณภาพเยี่ยม จัดส่งเร็ว",
    date: "2026-01-03",
    helpful: 12,
    images: [],
  },
  {
    id: 2,
    user: "สมหญิง รักสุข",
    rating: 4,
    comment: "ดีครับ ราคาเหมาะสม แต่บรรจุภัณฑ์อาจจะปรับปรุงได้",
    date: "2026-01-02",
    helpful: 8,
    images: [],
  },
  {
    id: 3,
    user: "วิชัย มั่นคง",
    rating: 5,
    comment: "ซื้อมาหลายครั้งแล้ว ไม่เคยผิดหวัง แนะนำเลยครับ",
    date: "2026-01-01",
    helpful: 15,
    images: [],
  },
]);

const showAll = ref(false);

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.value.length).toFixed(1);
});

const ratingDistribution = computed(() => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.value.forEach((review) => {
    dist[review.rating]++;
  });
  return dist;
});

const displayedReviews = computed(() => {
  return showAll.value ? reviews.value : reviews.value.slice(0, 3);
});

const getRatingPercentage = (rating) => {
  if (reviews.value.length === 0) return 0;
  return Math.round(
    (ratingDistribution.value[rating] / reviews.value.length) * 100
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>

<template>
  <div class="space-y-4">
    <!-- Rating Summary -->
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <h3 class="font-semibold text-gray-900 mb-4">รีวิวและคะแนน</h3>

      <div class="flex items-start gap-6 mb-4">
        <!-- Average Rating -->
        <div class="text-center">
          <div class="text-4xl font-bold text-gray-900 mb-1">
            {{ averageRating }}
          </div>
          <div class="flex items-center gap-1 mb-1">
            <Star
              v-for="i in 5"
              :key="i"
              class="w-4 h-4"
              :class="
                i <= Math.round(averageRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              "
            />
          </div>
          <div class="text-sm text-gray-500">{{ reviews.length }} รีวิว</div>
        </div>

        <!-- Rating Distribution -->
        <div class="flex-1 space-y-2">
          <div
            v-for="rating in [5, 4, 3, 2, 1]"
            :key="rating"
            class="flex items-center gap-2"
          >
            <div class="flex items-center gap-1 w-12">
              <span class="text-sm text-gray-600">{{ rating }}</span>
              <Star class="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-yellow-400 transition-all"
                :style="{ width: `${getRatingPercentage(rating)}%` }"
              ></div>
            </div>
            <span class="text-sm text-gray-500 w-10 text-right">
              {{ getRatingPercentage(rating) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Write Review Button -->
      <button
        class="w-full py-3 border border-[#007f3e] text-[#007f3e] rounded-xl font-medium hover:bg-[#007f3e] hover:text-white transition-colors"
      >
        เขียนรีวิว
      </button>
    </div>

    <!-- Reviews List -->
    <div class="space-y-3">
      <div
        v-for="review in displayedReviews"
        :key="review.id"
        class="bg-white rounded-xl p-4 shadow-sm"
      >
        <!-- User Info -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"
            >
              <span class="text-sm font-medium text-gray-600">
                {{ review.user.charAt(0) }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ review.user }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(review.date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Star
              v-for="i in 5"
              :key="i"
              class="w-4 h-4"
              :class="
                i <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              "
            />
          </div>
        </div>

        <!-- Comment -->
        <p class="text-gray-700 mb-3">{{ review.comment }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-4 text-sm">
          <button
            class="flex items-center gap-1 text-gray-500 hover:text-[#007f3e] transition-colors"
          >
            <ThumbsUp class="w-4 h-4" />
            <span>เป็นประโยชน์ ({{ review.helpful }})</span>
          </button>
          <button
            class="flex items-center gap-1 text-gray-500 hover:text-[#007f3e] transition-colors"
          >
            <MessageCircle class="w-4 h-4" />
            <span>ตอบกลับ</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Show More Button -->
    <button
      v-if="reviews.length > 3"
      @click="showAll = !showAll"
      class="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
    >
      <span>{{
        showAll ? "แสดงน้อยลง" : `ดูรีวิวทั้งหมด (${reviews.length})`
      }}</span>
      <ChevronDown
        class="w-5 h-5 transition-transform"
        :class="{ 'rotate-180': showAll }"
      />
    </button>
  </div>
</template>
