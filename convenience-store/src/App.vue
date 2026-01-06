<script setup>
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import ShopLayout from "./layouts/ShopLayout.vue";
import UpdateNotification from "./components/UpdateNotification.vue";

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));
</script>

<template>
  <ErrorBoundary>
    <!-- Admin routes: no ShopLayout wrapper -->
    <RouterView v-if="isAdminRoute" />

    <!-- Customer routes: with ShopLayout -->
    <ShopLayout v-else>
      <RouterView />
    </ShopLayout>

    <!-- Update Notification (production) -->
    <UpdateNotification />
  </ErrorBoundary>
</template>
