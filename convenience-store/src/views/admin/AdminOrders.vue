<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAdminStore } from "../../stores/admin";
import { supabase } from "../../lib/supabase";
import OrderAnalytics from "../../components/OrderAnalytics.vue";
import OrderInvoice from "../../components/OrderInvoice.vue";
import StoreSettingsModal from "../../components/StoreSettingsModal.vue";
import {
  Eye,
  X,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  Banknote,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  PlusCircle,
  CheckSquare,
  Square,
  Download,
  History,
  User,
  Printer,
  BarChart3,
  Settings,
} from "lucide-vue-next";

const adminStore = useAdminStore();
const selectedOrder = ref(null);
const editingOrder = ref(null);
const editingItem = ref(null);
const showAddProduct = ref(false);
const addProductSearch = ref("");
const addProductQuantity = ref(1);
const selectedProduct = ref(null);
const filterStatus = ref("all");
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 15;
const showDeleteConfirm = ref(null);
const showDeleteItemConfirm = ref(null);
const showStoreSettings = ref(false);
const actionLoading = ref(false);
const actionError = ref("");

// Bulk Actions
const selectedOrderIds = ref(new Set());
const showBulkStatusModal = ref(false);
const bulkNewStatus = ref("confirmed");

// Order History
const showOrderHistory = ref(false);
const orderHistory = ref([]);
const historyLoading = ref(false);

// Invoice & Analytics
const showInvoiceModal = ref(false);
const invoiceOrder = ref(null);
const showAnalytics = ref(false);

let ordersSubscription = null;

const statusOptions = [
  {
    value: "pending",
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  {
    value: "confirmed",
    label: "ยืนยันแล้ว",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  {
    value: "preparing",
    label: "กำลังจัดเตรียม",
    color: "bg-purple-100 text-purple-700",
    icon: Package,
  },
  {
    value: "delivering",
    label: "กำลังจัดส่ง",
    color: "bg-indigo-100 text-indigo-700",
    icon: Truck,
  },
  {
    value: "completed",
    label: "จัดส่งสำเร็จ",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  {
    value: "cancelled",
    label: "ยกเลิก",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
];

const filteredOrders = computed(() => {
  let result = adminStore.orders;
  if (filterStatus.value !== "all")
    result = result.filter((o) => o.status === filterStatus.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (o) =>
        String(o.id).includes(q) ||
        o.user_id?.toLowerCase().includes(q) ||
        o.addresses?.label?.toLowerCase().includes(q)
    );
  }
  return result;
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredOrders.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() =>
  Math.ceil(filteredOrders.value.length / itemsPerPage)
);

const orderStats = computed(() => ({
  total: adminStore.orders.length,
  pending: adminStore.orders.filter((o) => o.status === "pending").length,
  delivering: adminStore.orders.filter((o) => o.status === "delivering").length,
  completed: adminStore.orders.filter((o) => o.status === "completed").length,
}));

const filteredProducts = computed(() => {
  if (!addProductSearch.value.trim()) return adminStore.products.slice(0, 20);
  const q = addProductSearch.value.toLowerCase();
  return adminStore.products
    .filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.name_en?.toLowerCase().includes(q)
    )
    .slice(0, 20);
});

const isAllSelected = computed(
  () =>
    paginatedOrders.value.length > 0 &&
    paginatedOrders.value.every((o) => selectedOrderIds.value.has(o.id))
);
const hasSelection = computed(() => selectedOrderIds.value.size > 0);

function initRealtimeSubscription() {
  ordersSubscription = supabase
    .channel("admin-orders-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      async (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === "INSERT") {
          const { data } = await supabase
            .from("orders")
            .select("*, order_items (*), addresses (*)")
            .eq("id", newRecord.id)
            .single();
          if (data) adminStore.orders.unshift(data);
        } else if (eventType === "UPDATE") {
          const idx = adminStore.orders.findIndex((o) => o.id === newRecord.id);
          if (idx !== -1) {
            adminStore.orders[idx] = {
              ...adminStore.orders[idx],
              ...newRecord,
            };
            if (selectedOrder.value?.id === newRecord.id)
              selectedOrder.value = { ...selectedOrder.value, ...newRecord };
          }
        } else if (eventType === "DELETE") {
          adminStore.orders = adminStore.orders.filter(
            (o) => o.id !== oldRecord.id
          );
          if (selectedOrder.value?.id === oldRecord.id)
            selectedOrder.value = null;
        }
      }
    )
    .subscribe();
}

onMounted(async () => {
  console.log("[AdminOrders] Component mounted, fetching data...");

  // Debug: Check current user and role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("[AdminOrders] Current user:", user?.id, user?.email);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    console.log("[AdminOrders] User profile:", profile);
  }

  // Debug: Direct query to check orders count
  const { count, error: countErr } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });
  console.log("[AdminOrders] Direct orders count:", count, "error:", countErr);

  try {
    await adminStore.fetchAllOrders();
    console.log("[AdminOrders] Orders loaded:", adminStore.orders.length);
    await adminStore.fetchAllProducts();
    console.log("[AdminOrders] Products loaded:", adminStore.products.length);
    initRealtimeSubscription();
  } catch (e) {
    console.error("[AdminOrders] Mount error:", e);
    actionError.value = e.message;
  }
});
onUnmounted(() => {
  if (ordersSubscription) supabase.removeChannel(ordersSubscription);
});

function getStatusConfig(status) {
  return (
    statusOptions.find((s) => s.value === status) || {
      label: status,
      color: "bg-gray-100 text-gray-700",
      icon: Package,
    }
  );
}
function formatDate(date) {
  return new Date(date).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
function formatCurrency(val) {
  return new Intl.NumberFormat("th-TH").format(val || 0);
}
function refreshOrders() {
  adminStore.fetchAllOrders();
}

async function updateStatus(orderId, status) {
  actionLoading.value = true;
  actionError.value = "";
  try {
    await adminStore.updateOrderStatus(orderId, status);
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

function openEditModal(order) {
  editingOrder.value = {
    id: order.id,
    status: order.status,
    notes: order.notes || "",
    delivery_fee: order.delivery_fee,
  };
}

async function saveOrder() {
  if (!editingOrder.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await adminStore.updateOrder(editingOrder.value.id, {
      status: editingOrder.value.status,
      notes: editingOrder.value.notes,
      delivery_fee: editingOrder.value.delivery_fee,
    });
    editingOrder.value = null;
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

async function confirmDelete() {
  if (!showDeleteConfirm.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await adminStore.deleteOrder(showDeleteConfirm.value);
    showDeleteConfirm.value = null;
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

function openEditItemModal(item) {
  editingItem.value = {
    id: item.id,
    order_id: item.order_id,
    product_name: item.product_name,
    product_price: item.product_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  };
}
function updateItemQuantity(delta) {
  if (!editingItem.value) return;
  const newQty = editingItem.value.quantity + delta;
  if (newQty < 1) return;
  editingItem.value.quantity = newQty;
  editingItem.value.subtotal = editingItem.value.product_price * newQty;
}

async function saveOrderItem() {
  if (!editingItem.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    const originalItem = selectedOrder.value?.order_items?.find(
      (i) => i.id === editingItem.value.id
    );
    await adminStore.updateOrderItem(editingItem.value.id, {
      quantity: editingItem.value.quantity,
      subtotal: editingItem.value.subtotal,
    });
    await adminStore.logOrderActivity(
      "update_order_item",
      editingItem.value.order_id,
      {
        oldValue: {
          product_name: editingItem.value.product_name,
          quantity: originalItem?.quantity,
        },
        newValue: {
          product_name: editingItem.value.product_name,
          quantity: editingItem.value.quantity,
        },
      }
    );
    const updatedOrder = await adminStore.recalculateOrderTotals(
      editingItem.value.order_id
    );
    if (selectedOrder.value?.id === editingItem.value.order_id && updatedOrder)
      selectedOrder.value = updatedOrder;
    editingItem.value = null;
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

async function confirmDeleteItem() {
  if (!showDeleteItemConfirm.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    const { itemId, orderId, name } = showDeleteItemConfirm.value;
    await adminStore.logOrderActivity("delete_order_item", orderId, {
      oldValue: { product_name: name },
      newValue: null,
    });
    await adminStore.deleteOrderItem(itemId);
    const updatedOrder = await adminStore.recalculateOrderTotals(orderId);
    if (selectedOrder.value?.id === orderId && updatedOrder)
      selectedOrder.value = updatedOrder;
    showDeleteItemConfirm.value = null;
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

function openAddProductModal() {
  showAddProduct.value = true;
  addProductSearch.value = "";
  addProductQuantity.value = 1;
  selectedProduct.value = null;
}
function selectProduct(product) {
  selectedProduct.value = product;
  addProductQuantity.value = 1;
}

async function addProductToOrder() {
  if (!selectedProduct.value || !selectedOrder.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await adminStore.addOrderItem(
      selectedOrder.value.id,
      selectedProduct.value,
      addProductQuantity.value
    );
    await adminStore.logOrderActivity(
      "add_order_item",
      selectedOrder.value.id,
      {
        oldValue: null,
        newValue: {
          product_name: selectedProduct.value.name,
          quantity: addProductQuantity.value,
        },
      }
    );
    const updatedOrder = await adminStore.recalculateOrderTotals(
      selectedOrder.value.id
    );
    if (updatedOrder) selectedOrder.value = updatedOrder;
    showAddProduct.value = false;
    selectedProduct.value = null;
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

// Bulk Actions
function toggleSelectAll() {
  if (isAllSelected.value) {
    paginatedOrders.value.forEach((o) => selectedOrderIds.value.delete(o.id));
  } else {
    paginatedOrders.value.forEach((o) => selectedOrderIds.value.add(o.id));
  }
}
function toggleSelectOrder(orderId) {
  if (selectedOrderIds.value.has(orderId)) {
    selectedOrderIds.value.delete(orderId);
  } else {
    selectedOrderIds.value.add(orderId);
  }
}
function clearSelection() {
  selectedOrderIds.value.clear();
}

async function bulkUpdateStatus() {
  if (selectedOrderIds.value.size === 0) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    const ids = Array.from(selectedOrderIds.value);
    for (const id of ids) {
      await adminStore.updateOrderStatus(id, bulkNewStatus.value);
      await adminStore.logOrderActivity("bulk_status_change", id, {
        newValue: { status: bulkNewStatus.value },
      });
    }
    showBulkStatusModal.value = false;
    clearSelection();
  } catch (e) {
    actionError.value = e.message;
  } finally {
    actionLoading.value = false;
  }
}

function exportToCSV() {
  const ordersToExport = hasSelection.value
    ? adminStore.orders.filter((o) => selectedOrderIds.value.has(o.id))
    : filteredOrders.value;
  const headers = [
    "รหัส",
    "สถานะ",
    "ที่อยู่",
    "รายการ",
    "ยอดสินค้า",
    "ค่าจัดส่ง",
    "ส่วนลด",
    "ยอดรวม",
    "วันที่สั่ง",
  ];
  const rows = ordersToExport.map((o) => [
    o.id,
    getStatusConfig(o.status).label,
    o.addresses?.label || "-",
    o.order_items?.length || 0,
    o.subtotal || 0,
    o.delivery_fee || 0,
    o.discount || 0,
    o.total || 0,
    formatDate(o.created_at),
  ]);
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

// Order History
async function fetchOrderHistory(orderId) {
  historyLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, profiles:user_id(full_name, role)")
      .eq("entity_type", "order")
      .eq("entity_id", String(orderId))
      .order("created_at", { ascending: false });
    if (error) throw error;
    orderHistory.value = data || [];
  } catch (e) {
    orderHistory.value = [];
  } finally {
    historyLoading.value = false;
  }
}

async function openOrderHistory(orderId) {
  showOrderHistory.value = true;
  await fetchOrderHistory(orderId);
}

function getActionLabel(action) {
  const labels = {
    status_change: "เปลี่ยนสถานะ",
    update_order_item: "แก้ไขสินค้า",
    delete_order_item: "ลบสินค้า",
    add_order_item: "เพิ่มสินค้า",
    bulk_status_change: "เปลี่ยนสถานะ (Bulk)",
    create: "สร้างคำสั่งซื้อ",
    update: "แก้ไขคำสั่งซื้อ",
    delete: "ลบคำสั่งซื้อ",
  };
  return labels[action] || action;
}

function getActionColor(action) {
  const colors = {
    status_change: "bg-blue-100 text-blue-700",
    update_order_item: "bg-orange-100 text-orange-700",
    delete_order_item: "bg-red-100 text-red-700",
    add_order_item: "bg-green-100 text-green-700",
    bulk_status_change: "bg-purple-100 text-purple-700",
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
  };
  return colors[action] || "bg-gray-100 text-gray-700";
}

// Invoice functions
function openInvoice(order) {
  invoiceOrder.value = order;
  showInvoiceModal.value = true;
}
</script>

<template>
  <div>
    <!-- Analytics Toggle -->
    <div class="mb-6">
      <button
        @click="showAnalytics = !showAnalytics"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
          showAnalytics
            ? 'bg-blue-600 text-white'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        ]"
      >
        <BarChart3 class="w-4 h-4" />
        <span>{{ showAnalytics ? "ซ่อน Analytics" : "แสดง Analytics" }}</span>
      </button>
    </div>

    <!-- Analytics Dashboard -->
    <div v-if="showAnalytics" class="mb-8">
      <OrderAnalytics />
    </div>

    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold">จัดการคำสั่งซื้อ</h1>
        <p class="text-gray-500 text-sm mt-1">
          ทั้งหมด {{ orderStats.total }} รายการ
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="showStoreSettings = true"
          class="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg"
          title="ตั้งค่าข้อมูลร้าน"
        >
          <Settings class="w-4 h-4" /><span>ตั้งค่าใบเสร็จ</span>
        </button>
        <button
          @click="exportToCSV"
          class="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
        >
          <Download class="w-4 h-4" /><span>Export CSV</span>
        </button>
        <button
          @click="refreshOrders"
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw
            class="w-4 h-4"
            :class="{ 'animate-spin': adminStore.loading }"
          /><span>รีเฟรช</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm">
        <p class="text-gray-500 text-sm">ทั้งหมด</p>
        <p class="text-2xl font-bold text-gray-800">{{ orderStats.total }}</p>
      </div>
      <div class="bg-yellow-50 rounded-xl p-4 shadow-sm">
        <p class="text-yellow-600 text-sm">รอดำเนินการ</p>
        <p class="text-2xl font-bold text-yellow-700">
          {{ orderStats.pending }}
        </p>
      </div>
      <div class="bg-indigo-50 rounded-xl p-4 shadow-sm">
        <p class="text-indigo-600 text-sm">กำลังจัดส่ง</p>
        <p class="text-2xl font-bold text-indigo-700">
          {{ orderStats.delivering }}
        </p>
      </div>
      <div class="bg-green-50 rounded-xl p-4 shadow-sm">
        <p class="text-green-600 text-sm">สำเร็จ</p>
        <p class="text-2xl font-bold text-green-700">
          {{ orderStats.completed }}
        </p>
      </div>
    </div>

    <!-- Filters & Bulk Actions -->
    <div class="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาด้วยรหัสออเดอร์..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          v-model="filterStatus"
          class="border rounded-lg px-4 py-2 min-w-[160px]"
        >
          <option value="all">ทุกสถานะ</option>
          <option v-for="s in statusOptions" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>
      <div
        v-if="hasSelection"
        class="mt-4 pt-4 border-t flex items-center gap-4 flex-wrap"
      >
        <span class="text-sm text-gray-600"
          >เลือก {{ selectedOrderIds.size }} รายการ</span
        >
        <button
          @click="showBulkStatusModal = true"
          class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
        >
          เปลี่ยนสถานะ
        </button>
        <button
          @click="exportToCSV"
          class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
        >
          Export ที่เลือก
        </button>
        <button
          @click="clearSelection"
          class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          ยกเลิกการเลือก
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="actionError || adminStore.error"
      class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
    >
      <AlertCircle class="w-5 h-5" /><span>{{
        actionError || adminStore.error
      }}</span>
      <button
        @click="
          actionError = '';
          adminStore.error = null;
        "
        class="ml-auto"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Empty State - No Orders -->
    <div
      v-if="adminStore.orders.length === 0 && !adminStore.loading"
      class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-xl mb-4"
    >
      <p class="font-medium mb-2">📦 ยังไม่มีคำสั่งซื้อในระบบ</p>
      <p class="text-sm">ลูกค้ายังไม่ได้สั่งซื้อสินค้า คุณสามารถทดสอบได้โดย:</p>
      <ol class="text-sm list-decimal list-inside mt-2 space-y-1">
        <li>
          ไปที่หน้าร้าน
          <a
            href="/customer"
            target="_blank"
            class="underline text-blue-600 hover:text-blue-800"
            >/customer</a
          >
        </li>
        <li>สมัครสมาชิกหรือเข้าสู่ระบบ</li>
        <li>เพิ่มที่อยู่จัดส่ง</li>
        <li>เพิ่มสินค้าลงตะกร้าและสั่งซื้อ</li>
        <li>กลับมาที่หน้านี้เพื่อดูคำสั่งซื้อ</li>
      </ol>
    </div>

    <!-- Orders Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">
                <button
                  @click="toggleSelectAll"
                  class="p-1 hover:bg-gray-200 rounded"
                >
                  <component
                    :is="isAllSelected ? CheckSquare : Square"
                    class="w-5 h-5 text-gray-600"
                  />
                </button>
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                รหัส
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ลูกค้า/ที่อยู่
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                รายการ
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                ยอดรวม
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                สถานะ
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                วันที่
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-if="adminStore.loading && adminStore.orders.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                กำลังโหลด...
              </td>
            </tr>
            <tr v-else-if="paginatedOrders.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                ไม่พบคำสั่งซื้อ
              </td>
            </tr>
            <tr
              v-for="order in paginatedOrders"
              :key="order.id"
              class="hover:bg-gray-50"
              :class="{ 'bg-blue-50': selectedOrderIds.has(order.id) }"
            >
              <td class="px-4 py-3">
                <button
                  @click="toggleSelectOrder(order.id)"
                  class="p-1 hover:bg-gray-200 rounded"
                >
                  <component
                    :is="selectedOrderIds.has(order.id) ? CheckSquare : Square"
                    class="w-5 h-5"
                    :class="
                      selectedOrderIds.has(order.id)
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    "
                  />
                </button>
              </td>
              <td class="px-4 py-3">
                <span class="font-bold text-green-600">#{{ order.id }}</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-700 text-sm">
                  {{ order.addresses?.label || "ไม่ระบุ" }}
                </p>
                <p class="text-xs text-gray-500 truncate max-w-[200px]">
                  {{ order.addresses?.address_line || "-" }}
                </p>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm"
                  >{{ order.order_items?.length || 0 }} รายการ</span
                >
              </td>
              <td class="px-4 py-3">
                <span class="font-bold text-green-600"
                  >฿{{ formatCurrency(order.total) }}</span
                >
              </td>
              <td class="px-4 py-3">
                <select
                  :value="order.status"
                  @change="updateStatus(order.id, $event.target.value)"
                  :class="[
                    'px-2 py-1 rounded-lg text-sm border-0 cursor-pointer',
                    getStatusConfig(order.status).color,
                  ]"
                >
                  <option
                    v-for="s in statusOptions"
                    :key="s.value"
                    :value="s.value"
                  >
                    {{ s.label }}
                  </option>
                </select>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                {{ formatDate(order.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button
                    @click="selectedOrder = order"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="ดูรายละเอียด"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    @click="openInvoice(order)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="พิมพ์ใบเสร็จ"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                  <button
                    @click="openOrderHistory(order.id)"
                    class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="ประวัติ"
                  >
                    <History class="w-4 h-4" />
                  </button>
                  <button
                    @click="openEditModal(order)"
                    class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="แก้ไข"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    @click="showDeleteConfirm = order.id"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="ลบ"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t"
      >
        <p class="text-sm text-gray-500">
          หน้า {{ currentPage }} จาก {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedOrder"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="selectedOrder = null"
      >
        <div
          class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex justify-between items-center p-4 border-b sticky top-0 bg-white"
          >
            <h3 class="text-lg font-bold">
              คำสั่งซื้อ #{{ selectedOrder.id }}
            </h3>
            <button
              @click="selectedOrder = null"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex items-center gap-2">
              <component
                :is="getStatusConfig(selectedOrder.status).icon"
                class="w-5 h-5"
              />
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  getStatusConfig(selectedOrder.status).color,
                ]"
                >{{ getStatusConfig(selectedOrder.status).label }}</span
              >
              <span class="text-gray-500 text-sm ml-auto">{{
                formatDate(selectedOrder.created_at)
              }}</span>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <MapPin class="w-5 h-5 text-green-600 mt-0.5" />
                <div class="flex-1">
                  <p class="font-medium">
                    {{ selectedOrder.addresses?.label || "ไม่ระบุที่อยู่" }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ selectedOrder.addresses?.address_line || "-" }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ selectedOrder.addresses?.district }}
                    {{ selectedOrder.addresses?.province }}
                    {{ selectedOrder.addresses?.postal_code }}
                  </p>
                </div>
              </div>
              <div
                class="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600"
              >
                <component
                  :is="
                    selectedOrder.payment_method === 'cash'
                      ? Banknote
                      : CreditCard
                  "
                  class="w-4 h-4"
                />
                <span>{{
                  selectedOrder.payment_method === "cash"
                    ? "ชำระเงินสด"
                    : "ชำระด้วยบัตร"
                }}</span>
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold">
                  รายการสินค้า ({{ selectedOrder.order_items?.length || 0 }}
                  รายการ)
                </h4>
                <button
                  @click="openAddProductModal"
                  class="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                >
                  <PlusCircle class="w-4 h-4" /><span>เพิ่มสินค้า</span>
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="item in selectedOrder.order_items"
                  :key="item.id"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex-1">
                    <p class="font-medium">{{ item.product_name }}</p>
                    <p class="text-sm text-gray-500">
                      ฿{{ formatCurrency(item.product_price) }} x
                      {{ item.quantity }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-green-600 mr-2">
                      ฿{{ formatCurrency(item.subtotal) }}
                    </p>
                    <button
                      @click="
                        openEditItemModal({
                          ...item,
                          order_id: selectedOrder.id,
                        })
                      "
                      class="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button
                      @click="
                        showDeleteItemConfirm = {
                          itemId: item.id,
                          orderId: selectedOrder.id,
                          name: item.product_name,
                        }
                      "
                      class="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                      :disabled="selectedOrder.order_items?.length <= 1"
                      :class="{
                        'opacity-50 cursor-not-allowed':
                          selectedOrder.order_items?.length <= 1,
                      }"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-green-50 rounded-xl p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span>ยอดสินค้า</span
                ><span>฿{{ formatCurrency(selectedOrder.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>ค่าจัดส่ง</span
                ><span>{{
                  selectedOrder.delivery_fee === 0
                    ? "ฟรี"
                    : "฿" + formatCurrency(selectedOrder.delivery_fee)
                }}</span>
              </div>
              <div
                v-if="selectedOrder.discount > 0"
                class="flex justify-between text-sm text-green-600"
              >
                <span>ส่วนลด</span
                ><span>-฿{{ formatCurrency(selectedOrder.discount) }}</span>
              </div>
              <div
                class="flex justify-between font-bold text-lg pt-2 border-t border-green-200"
              >
                <span>รวมทั้งหมด</span
                ><span class="text-green-700"
                  >฿{{ formatCurrency(selectedOrder.total) }}</span
                >
              </div>
            </div>
            <div v-if="selectedOrder.notes" class="bg-yellow-50 rounded-xl p-4">
              <p class="text-sm font-medium text-yellow-800">หมายเหตุ:</p>
              <p class="text-sm text-yellow-700">{{ selectedOrder.notes }}</p>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                @click="openInvoice(selectedOrder)"
                class="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Printer class="w-4 h-4" />พิมพ์
              </button>
              <button
                @click="openOrderHistory(selectedOrder.id)"
                class="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 flex items-center justify-center gap-2"
              >
                <History class="w-4 h-4" />ประวัติ
              </button>
              <button
                @click="
                  openEditModal(selectedOrder);
                  selectedOrder = null;
                "
                class="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600"
              >
                แก้ไข
              </button>
              <button
                @click="
                  showDeleteConfirm = selectedOrder.id;
                  selectedOrder = null;
                "
                class="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Order Modal -->
    <Teleport to="body">
      <div
        v-if="editingOrder"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="editingOrder = null"
      >
        <div class="bg-white rounded-xl w-full max-w-md">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold">
              แก้ไขคำสั่งซื้อ #{{ editingOrder.id }}
            </h3>
            <button
              @click="editingOrder = null"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >สถานะ</label
              ><select
                v-model="editingOrder.status"
                class="w-full border rounded-lg px-3 py-2"
              >
                <option
                  v-for="s in statusOptions"
                  :key="s.value"
                  :value="s.value"
                >
                  {{ s.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ค่าจัดส่ง</label
              ><input
                v-model.number="editingOrder.delivery_fee"
                type="number"
                min="0"
                class="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >หมายเหตุ</label
              ><textarea
                v-model="editingOrder.notes"
                rows="3"
                class="w-full border rounded-lg px-3 py-2 resize-none"
                placeholder="หมายเหตุเพิ่มเติม..."
              ></textarea>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                @click="editingOrder = null"
                class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                ยกเลิก</button
              ><button
                @click="saveOrder"
                :disabled="actionLoading"
                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {{ actionLoading ? "กำลังบันทึก..." : "บันทึก" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showDeleteConfirm = null"
      >
        <div class="bg-white rounded-xl w-full max-w-sm p-6 text-center">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Trash2 class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-lg font-bold mb-2">ยืนยันการลบ?</h3>
          <p class="text-gray-500 mb-6">
            คำสั่งซื้อ #{{ showDeleteConfirm }} จะถูกลบถาวร
          </p>
          <div class="flex gap-2">
            <button
              @click="showDeleteConfirm = null"
              class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              ยกเลิก</button
            ><button
              @click="confirmDelete"
              :disabled="actionLoading"
              class="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {{ actionLoading ? "กำลังลบ..." : "ลบ" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Order Item Modal -->
    <Teleport to="body">
      <div
        v-if="editingItem"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="editingItem = null"
      >
        <div class="bg-white rounded-xl w-full max-w-sm">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold">แก้ไขจำนวนสินค้า</h3>
            <button
              @click="editingItem = null"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-medium text-gray-800">
                {{ editingItem.product_name }}
              </p>
              <p class="text-sm text-gray-500">
                ราคาต่อชิ้น: ฿{{ formatCurrency(editingItem.product_price) }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >จำนวน</label
              >
              <div class="flex items-center justify-center gap-4">
                <button
                  @click="updateItemQuantity(-1)"
                  :disabled="editingItem.quantity <= 1"
                  class="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                  <Minus class="w-5 h-5" /></button
                ><span class="text-2xl font-bold w-16 text-center">{{
                  editingItem.quantity
                }}</span
                ><button
                  @click="updateItemQuantity(1)"
                  class="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"
                >
                  <Plus class="w-5 h-5" />
                </button>
              </div>
            </div>
            <div class="bg-green-50 rounded-xl p-4 text-center">
              <p class="text-sm text-gray-600">ยอดรวมรายการนี้</p>
              <p class="text-2xl font-bold text-green-600">
                ฿{{ formatCurrency(editingItem.subtotal) }}
              </p>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                @click="editingItem = null"
                class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                ยกเลิก</button
              ><button
                @click="saveOrderItem"
                :disabled="actionLoading"
                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {{ actionLoading ? "กำลังบันทึก..." : "บันทึก" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Order Item Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteItemConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showDeleteItemConfirm = null"
      >
        <div class="bg-white rounded-xl w-full max-w-sm p-6 text-center">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Trash2 class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-lg font-bold mb-2">ลบรายการสินค้า?</h3>
          <p class="text-gray-500 mb-2">{{ showDeleteItemConfirm.name }}</p>
          <p class="text-sm text-gray-400 mb-6">
            ยอดรวมคำสั่งซื้อจะถูกคำนวณใหม่
          </p>
          <div class="flex gap-2">
            <button
              @click="showDeleteItemConfirm = null"
              class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              ยกเลิก</button
            ><button
              @click="confirmDeleteItem"
              :disabled="actionLoading"
              class="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {{ actionLoading ? "กำลังลบ..." : "ลบ" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bulk Status Change Modal -->
    <Teleport to="body">
      <div
        v-if="showBulkStatusModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showBulkStatusModal = false"
      >
        <div class="bg-white rounded-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-bold mb-4">
            เปลี่ยนสถานะ {{ selectedOrderIds.size }} รายการ
          </h3>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >สถานะใหม่</label
            ><select
              v-model="bulkNewStatus"
              class="w-full border rounded-lg px-3 py-2"
            >
              <option
                v-for="s in statusOptions"
                :key="s.value"
                :value="s.value"
              >
                {{ s.label }}
              </option>
            </select>
          </div>
          <div class="flex gap-2">
            <button
              @click="showBulkStatusModal = false"
              class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              ยกเลิก</button
            ><button
              @click="bulkUpdateStatus"
              :disabled="actionLoading"
              class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {{ actionLoading ? "กำลังอัพเดท..." : "อัพเดท" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Order History Timeline Modal -->
    <Teleport to="body">
      <div
        v-if="showOrderHistory"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showOrderHistory = false"
      >
        <div
          class="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        >
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <History class="w-5 h-5 text-purple-600" />ประวัติการแก้ไข
            </h3>
            <button
              @click="showOrderHistory = false"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 overflow-y-auto max-h-[60vh]">
            <div v-if="historyLoading" class="text-center py-8 text-gray-500">
              กำลังโหลด...
            </div>
            <div
              v-else-if="orderHistory.length === 0"
              class="text-center py-8 text-gray-500"
            >
              ไม่พบประวัติการแก้ไข
            </div>
            <div v-else class="relative">
              <div
                class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
              ></div>
              <div
                v-for="log in orderHistory"
                :key="log.id"
                class="relative pl-10 pb-6 last:pb-0"
              >
                <div
                  class="absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow"
                  :class="
                    getActionColor(log.action)
                      .replace('text-', 'bg-')
                      .split(' ')[0]
                  "
                ></div>
                <div class="bg-gray-50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getActionColor(log.action),
                      ]"
                      >{{ getActionLabel(log.action) }}</span
                    ><span class="text-xs text-gray-400">{{
                      formatDate(log.created_at)
                    }}</span>
                  </div>
                  <div
                    class="flex items-center gap-2 text-sm text-gray-600 mb-2"
                  >
                    <User class="w-4 h-4" /><span>{{
                      log.profiles?.full_name || "ระบบ"
                    }}</span
                    ><span class="text-xs text-gray-400"
                      >({{ log.profiles?.role || "-" }})</span
                    >
                  </div>
                  <div
                    v-if="log.old_value || log.new_value"
                    class="text-xs space-y-1"
                  >
                    <div v-if="log.old_value" class="bg-red-50 p-2 rounded">
                      <span class="text-red-600 font-medium">ก่อน:</span>
                      <pre class="text-red-700 whitespace-pre-wrap">{{
                        JSON.stringify(log.old_value, null, 2)
                      }}</pre>
                    </div>
                    <div v-if="log.new_value" class="bg-green-50 p-2 rounded">
                      <span class="text-green-600 font-medium">หลัง:</span>
                      <pre class="text-green-700 whitespace-pre-wrap">{{
                        JSON.stringify(log.new_value, null, 2)
                      }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add Product to Order Modal -->
    <Teleport to="body">
      <div
        v-if="showAddProduct"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAddProduct = false"
      >
        <div
          class="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold">เพิ่มสินค้าในคำสั่งซื้อ</h3>
            <button
              @click="showAddProduct = false"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4 border-b">
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              /><input
                v-model="addProductSearch"
                type="text"
                placeholder="ค้นหาสินค้า..."
                class="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="!selectedProduct" class="space-y-2">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                @click="selectProduct(product)"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <img
                  :src="
                    product.image || 'https://placehold.co/60x60?text=No+Image'
                  "
                  :alt="product.name"
                  class="w-12 h-12 object-cover rounded-lg"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ product.name }}</p>
                  <p class="text-sm text-gray-500">{{ product.name_en }}</p>
                </div>
                <p class="font-bold text-green-600">
                  ฿{{ formatCurrency(product.price) }}
                </p>
              </div>
              <p
                v-if="filteredProducts.length === 0"
                class="text-center text-gray-500 py-4"
              >
                ไม่พบสินค้า
              </p>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <img
                  :src="
                    selectedProduct.image ||
                    'https://placehold.co/80x80?text=No+Image'
                  "
                  :alt="selectedProduct.name"
                  class="w-16 h-16 object-cover rounded-lg"
                />
                <div class="flex-1">
                  <p class="font-bold">{{ selectedProduct.name }}</p>
                  <p class="text-sm text-gray-500">
                    {{ selectedProduct.name_en }}
                  </p>
                  <p class="text-green-600 font-bold">
                    ฿{{ formatCurrency(selectedProduct.price) }}
                  </p>
                </div>
                <button
                  @click="selectedProduct = null"
                  class="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >จำนวน</label
                >
                <div class="flex items-center justify-center gap-4">
                  <button
                    @click="
                      addProductQuantity = Math.max(1, addProductQuantity - 1)
                    "
                    :disabled="addProductQuantity <= 1"
                    class="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center disabled:opacity-50"
                  >
                    <Minus class="w-5 h-5" /></button
                  ><span class="text-2xl font-bold w-16 text-center">{{
                    addProductQuantity
                  }}</span
                  ><button
                    @click="addProductQuantity++"
                    class="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"
                  >
                    <Plus class="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div class="bg-green-50 rounded-xl p-4 text-center">
                <p class="text-sm text-gray-600">ยอดรวมรายการนี้</p>
                <p class="text-2xl font-bold text-green-600">
                  ฿{{
                    formatCurrency(selectedProduct.price * addProductQuantity)
                  }}
                </p>
              </div>
            </div>
          </div>
          <div v-if="selectedProduct" class="p-4 border-t">
            <div class="flex gap-2">
              <button
                @click="selectedProduct = null"
                class="flex-1 border py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                เลือกสินค้าอื่น</button
              ><button
                @click="addProductToOrder"
                :disabled="actionLoading"
                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {{ actionLoading ? "กำลังเพิ่ม..." : "เพิ่มสินค้า" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Invoice Modal -->
    <Teleport to="body">
      <div
        v-if="showInvoiceModal && invoiceOrder"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:bg-white print:p-0"
        @click.self="showInvoiceModal = false"
      >
        <div
          class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible"
        >
          <div
            class="flex justify-between items-center p-4 border-b print:hidden"
          >
            <h3 class="text-lg font-bold">ใบเสร็จรับเงิน</h3>
            <button
              @click="showInvoiceModal = false"
              class="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4">
            <OrderInvoice :order="invoiceOrder" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Store Settings Modal -->
    <StoreSettingsModal
      :show="showStoreSettings"
      @close="showStoreSettings = false"
    />
  </div>
</template>
