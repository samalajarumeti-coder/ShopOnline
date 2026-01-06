<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth";
import {
  Package,
  ShoppingCart,
  Tag,
  Image,
  Ticket,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  LogOut,
  Menu,
  LayoutDashboard,
  Store,
  Eye,
  MapPin,
  User,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// UI State
const showSidebar = ref(true);
const loading = ref(false);
const searchQuery = ref("");
const notFound = ref(false);

// Data
const stats = ref({ products: 0, orders: 0, users: 0, revenue: 0 });
const products = ref([]);
const categories = ref([]);
const orders = ref([]);
const banners = ref([]);
const coupons = ref([]);
const addresses = ref([]);

// Modal State
const showModal = ref(false);
const showOrderDetail = ref(false);
const modalMode = ref("add");
const modalType = ref("product");
const editingItem = ref(null);
const selectedOrder = ref(null);

// Forms
const productForm = ref({
  name: "",
  price: 0,
  original_price: null,
  image: "",
  category_id: "",
  is_flash_sale: false,
});
const categoryForm = ref({ name: "", icon: "📦" });
const bannerForm = ref({ title: "", subtitle: "", image: "" });
const couponForm = ref({
  code: "",
  discount_type: "percent",
  discount_value: 0,
  min_order: 0,
});

// Computed from route
const activeTab = computed(() => route.meta.tab || "dashboard");
const routeMode = computed(() => route.meta.mode || null);
const routeId = computed(() => route.params.id || null);

// Navigation tabs
const tabs = [
  {
    id: "dashboard",
    name: "แดชบอร์ด",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
  },
  { id: "products", name: "สินค้า", icon: Package, path: "/admin/products" },
  { id: "categories", name: "หมวดหมู่", icon: Tag, path: "/admin/categories" },
  {
    id: "orders",
    name: "คำสั่งซื้อ",
    icon: ShoppingCart,
    path: "/admin/orders",
  },
  { id: "banners", name: "แบนเนอร์", icon: Image, path: "/admin/banners" },
  { id: "coupons", name: "คูปอง", icon: Ticket, path: "/admin/coupons" },
];

// Current page for breadcrumb
const currentPage = computed(
  () => tabs.find((t) => t.id === activeTab.value) || tabs[0]
);

// Dynamic breadcrumb
const breadcrumbs = computed(() => {
  const crumbs = [
    { name: "Admin", path: "/admin/dashboard" },
    { name: currentPage.value.name, path: currentPage.value.path },
  ];
  if (routeMode.value === "add") {
    crumbs.push({ name: "เพิ่มใหม่", path: route.fullPath });
  } else if (routeMode.value === "edit" && routeId.value) {
    crumbs.push({ name: `แก้ไข #${routeId.value}`, path: route.fullPath });
  } else if (routeMode.value === "detail" && routeId.value) {
    crumbs.push({ name: `รายละเอียด #${routeId.value}`, path: route.fullPath });
  }
  return crumbs;
});

// Get item name for display
const currentItemName = computed(() => {
  if (!routeId.value) return null;
  const dataMap = { products, categories, banners, coupons, orders };
  const item = dataMap[activeTab.value]?.value?.find(
    (i) => String(i.id) === String(routeId.value)
  );
  return item?.name || item?.title || item?.code || null;
});

// Filtered products for search
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Status helpers
const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  delivering: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  preparing: "กำลังเตรียม",
  delivering: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

// Load all data
const loadData = async () => {
  loading.value = true;
  try {
    const [p, c, o, b, cp, addr] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: false }),
      supabase.from("banners").select("*"),
      supabase.from("coupons").select("*"),
      supabase.from("addresses").select("*"),
    ]);
    products.value = p.data || [];
    categories.value = c.data || [];
    orders.value = o.data || [];
    banners.value = b.data || [];
    coupons.value = cp.data || [];
    addresses.value = addr.data || [];
    stats.value = {
      products: products.value.length,
      orders: orders.value.length,
      users: new Set(orders.value.map((x) => x.user_id)).size,
      revenue: orders.value.reduce((s, x) => s + Number(x.total || 0), 0),
    };
  } finally {
    loading.value = false;
  }
};

// Check admin and load data
const checkAdminAndLoad = async () => {
  while (authStore.loading) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!authStore.isLoggedIn) {
    router.push("/admin/login");
    return;
  }
  const { data: adminData } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", authStore.user.id)
    .single();
  if (!adminData) {
    router.push("/admin/login");
    return;
  }
  await loadData();
  setupModalFromRoute();
};

// Setup modal based on route
const setupModalFromRoute = () => {
  notFound.value = false;
  showModal.value = false;
  showOrderDetail.value = false;

  if (!routeMode.value) return;

  const typeMap = {
    products: "product",
    categories: "category",
    banners: "banner",
    coupons: "coupon",
  };
  const type = typeMap[activeTab.value] || "product";
  modalType.value = type;
  modalMode.value = routeMode.value;

  if (routeMode.value === "edit" && routeId.value) {
    const dataMap = {
      product: products,
      category: categories,
      banner: banners,
      coupon: coupons,
    };
    const item = dataMap[type]?.value?.find(
      (i) => String(i.id) === String(routeId.value)
    );
    if (item) {
      editingItem.value = item;
      if (type === "product") productForm.value = { ...item };
      else if (type === "category") categoryForm.value = { ...item };
      else if (type === "banner") bannerForm.value = { ...item };
      else if (type === "coupon") couponForm.value = { ...item };
      showModal.value = true;
    } else {
      notFound.value = true;
    }
  } else if (routeMode.value === "add") {
    editingItem.value = null;
    productForm.value = {
      name: "",
      price: 0,
      original_price: null,
      image: "",
      category_id: "",
      is_flash_sale: false,
    };
    categoryForm.value = { name: "", icon: "📦" };
    bannerForm.value = { title: "", subtitle: "", image: "" };
    couponForm.value = {
      code: "",
      discount_type: "percent",
      discount_value: 0,
      min_order: 0,
    };
    showModal.value = true;
  } else if (routeMode.value === "detail" && routeId.value) {
    const order = orders.value.find(
      (o) => String(o.id) === String(routeId.value)
    );
    if (order) {
      selectedOrder.value = order;
      showOrderDetail.value = true;
    } else {
      notFound.value = true;
    }
  }
};

// Watch route changes
watch(() => route.fullPath, setupModalFromRoute);

onMounted(checkAdminAndLoad);

// Actions
const openModal = (type, mode = "add", item = null) => {
  if (mode === "add") {
    router.push(
      `/admin/${type === "category" ? "categories" : type + "s"}/new`
    );
  } else if (mode === "edit" && item) {
    router.push(
      `/admin/${type === "category" ? "categories" : type + "s"}/${item.id}`
    );
  }
};

const closeModal = () => {
  showModal.value = false;
  router.push(`/admin/${activeTab.value}`);
};

const closeOrderDetail = () => {
  showOrderDetail.value = false;
  router.push("/admin/orders");
};

const saveItem = async () => {
  loading.value = true;
  const table =
    modalType.value === "category" ? "categories" : modalType.value + "s";
  const form =
    modalType.value === "product"
      ? productForm.value
      : modalType.value === "category"
      ? categoryForm.value
      : modalType.value === "banner"
      ? bannerForm.value
      : couponForm.value;

  if (modalMode.value === "add") {
    await supabase.from(table).insert(form);
  } else {
    await supabase.from(table).update(form).eq("id", editingItem.value.id);
  }
  await loadData();
  closeModal();
};

const deleteItem = async (type, id) => {
  if (!confirm("ยืนยันการลบ?")) return;
  const table = type === "category" ? "categories" : type + "s";
  await supabase.from(table).delete().eq("id", id);
  await loadData();
};

const updateOrderStatus = async (id, status) => {
  await supabase.from("orders").update({ status }).eq("id", id);
  await loadData();
};

const viewOrderDetail = (order) => router.push(`/admin/orders/${order.id}`);
const getOrderAddress = (order) =>
  addresses.value.find((a) => a.id === order.address_id);
const handleLogout = async () => {
  await authStore.signOut();
  router.push("/customer");
};
const goBack = () => router.push(`/admin/${activeTab.value}`);
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">
    <!-- Sidebar -->
    <aside
      class="bg-slate-800 text-white flex-shrink-0 flex flex-col transition-all duration-300"
      :class="showSidebar ? 'w-64' : 'w-0 overflow-hidden'"
    >
      <!-- Logo -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center"
          >
            <Store class="w-6 h-6" />
          </div>
          <div>
            <h1 class="font-bold">Admin Panel</h1>
            <p class="text-xs text-slate-400">จัดการระบบ</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-2 flex-1">
        <router-link
          v-for="tab in tabs"
          :key="tab.id"
          :to="tab.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors"
          :class="
            activeTab === tab.id
              ? 'bg-green-700 text-white'
              : 'text-slate-300 hover:bg-slate-700'
          "
        >
          <component :is="tab.icon" class="w-5 h-5" />
          <span>{{ tab.name }}</span>
        </router-link>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-700">
        <router-link
          to="/customer"
          class="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg mb-2"
        >
          <Store class="w-5 h-5" />
          <span>กลับหน้าร้าน</span>
        </router-link>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg"
        >
          <LogOut class="w-5 h-5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <!-- Header -->
      <header class="bg-white shadow-sm p-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="showSidebar = !showSidebar"
            class="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu class="w-5 h-5" />
          </button>
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1 text-sm">
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
              <router-link
                v-if="index < breadcrumbs.length - 1"
                :to="crumb.path"
                class="text-slate-500 hover:text-green-700"
                >{{ crumb.name }}</router-link
              >
              <span v-else class="font-medium text-slate-800">{{
                currentItemName || crumb.name
              }}</span>
              <ChevronRight
                v-if="index < breadcrumbs.length - 1"
                class="w-4 h-4 text-slate-300"
              />
            </template>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <div v-if="activeTab === 'products' && !routeMode" class="relative">
            <Search
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              v-model="searchQuery"
              placeholder="ค้นหาสินค้า..."
              class="pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <span class="text-sm text-slate-600">{{
            authStore.user?.email
          }}</span>
        </div>
      </header>

      <!-- Content -->
      <div class="p-6">
        <!-- 404 Not Found -->
        <div
          v-if="notFound"
          class="flex flex-col items-center justify-center py-20"
        >
          <div class="bg-red-100 p-6 rounded-full mb-6">
            <AlertTriangle class="w-16 h-16 text-red-500" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">ไม่พบข้อมูล</h2>
          <p class="text-slate-500 mb-6">
            ไม่พบรายการที่คุณกำลังค้นหา (ID: {{ routeId }})
          </p>
          <button
            @click="goBack"
            class="flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            <ArrowLeft class="w-5 h-5" />
            กลับไปหน้ารายการ
          </button>
        </div>

        <!-- Loading -->
        <div v-else-if="loading" class="flex justify-center py-12">
          <div
            class="animate-spin w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full"
          ></div>
        </div>

        <!-- Dashboard -->
        <div v-else-if="activeTab === 'dashboard'" class="space-y-6">
          <h2 class="text-2xl font-bold">แดชบอร์ด</h2>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-6 rounded-xl shadow-sm">
              <Package class="w-8 h-8 text-blue-500 mb-2" />
              <p class="text-2xl font-bold">{{ stats.products }}</p>
              <p class="text-slate-500 text-sm">สินค้าทั้งหมด</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
              <ShoppingCart class="w-8 h-8 text-green-500 mb-2" />
              <p class="text-2xl font-bold">{{ stats.orders }}</p>
              <p class="text-slate-500 text-sm">คำสั่งซื้อ</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
              <User class="w-8 h-8 text-purple-500 mb-2" />
              <p class="text-2xl font-bold">{{ stats.users }}</p>
              <p class="text-slate-500 text-sm">ลูกค้า</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
              <Tag class="w-8 h-8 text-orange-500 mb-2" />
              <p class="text-2xl font-bold">
                ฿{{ stats.revenue.toLocaleString() }}
              </p>
              <p class="text-slate-500 text-sm">รายได้รวม</p>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div v-else-if="activeTab === 'products'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">สินค้า</h2>
            <button
              @click="openModal('product')"
              class="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> เพิ่มสินค้า
            </button>
          </div>
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="text-left p-4">สินค้า</th>
                  <th class="text-left p-4">หมวดหมู่</th>
                  <th class="text-left p-4">ราคา</th>
                  <th class="text-left p-4">Flash</th>
                  <th class="text-left p-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filteredProducts" :key="p.id" class="border-t">
                  <td class="p-4 flex items-center gap-3">
                    <img
                      :src="p.image"
                      class="w-12 h-12 rounded-lg object-cover"
                    />
                    <span>{{ p.name }}</span>
                  </td>
                  <td class="p-4">
                    {{
                      categories.find((c) => c.id === p.category_id)?.name ||
                      "-"
                    }}
                  </td>
                  <td class="p-4">฿{{ p.price }}</td>
                  <td class="p-4">
                    <span
                      :class="
                        p.is_flash_sale ? 'text-green-600' : 'text-slate-400'
                      "
                      >{{ p.is_flash_sale ? "✓" : "-" }}</span
                    >
                  </td>
                  <td class="p-4 flex gap-2">
                    <button
                      @click="openModal('product', 'edit', p)"
                      class="p-2 hover:bg-slate-100 rounded"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      @click="deleteItem('product', p.id)"
                      class="p-2 hover:bg-red-100 text-red-500 rounded"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Categories -->
        <div v-else-if="activeTab === 'categories'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">หมวดหมู่</h2>
            <button
              @click="openModal('category')"
              class="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> เพิ่มหมวดหมู่
            </button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="c in categories"
              :key="c.id"
              class="bg-white p-4 rounded-xl shadow-sm"
            >
              <div class="text-3xl mb-2">{{ c.icon }}</div>
              <p class="font-medium">{{ c.name }}</p>
              <div class="flex gap-2 mt-3">
                <button
                  @click="openModal('category', 'edit', c)"
                  class="p-2 hover:bg-slate-100 rounded"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem('category', c.id)"
                  class="p-2 hover:bg-red-100 text-red-500 rounded"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders -->
        <div v-else-if="activeTab === 'orders'" class="space-y-4">
          <h2 class="text-2xl font-bold">คำสั่งซื้อ</h2>
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="text-left p-4">#</th>
                  <th class="text-left p-4">วันที่</th>
                  <th class="text-left p-4">ยอดรวม</th>
                  <th class="text-left p-4">สถานะ</th>
                  <th class="text-left p-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in orders" :key="o.id" class="border-t">
                  <td class="p-4">#{{ o.id }}</td>
                  <td class="p-4">
                    {{ new Date(o.created_at).toLocaleDateString("th-TH") }}
                  </td>
                  <td class="p-4">฿{{ o.total }}</td>
                  <td class="p-4">
                    <select
                      v-model="o.status"
                      @change="updateOrderStatus(o.id, o.status)"
                      class="text-sm px-2 py-1 rounded border"
                      :class="statusColors[o.status]"
                    >
                      <option
                        v-for="(label, key) in statusLabels"
                        :key="key"
                        :value="key"
                      >
                        {{ label }}
                      </option>
                    </select>
                  </td>
                  <td class="p-4">
                    <button
                      @click="viewOrderDetail(o)"
                      class="p-2 hover:bg-slate-100 rounded"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Banners -->
        <div v-else-if="activeTab === 'banners'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">แบนเนอร์</h2>
            <button
              @click="openModal('banner')"
              class="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> เพิ่มแบนเนอร์
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="b in banners"
              :key="b.id"
              class="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <img :src="b.image" class="w-full h-40 object-cover" />
              <div class="p-4">
                <p class="font-medium">{{ b.title }}</p>
                <p class="text-sm text-slate-500">{{ b.subtitle }}</p>
                <div class="flex gap-2 mt-3">
                  <button
                    @click="openModal('banner', 'edit', b)"
                    class="p-2 hover:bg-slate-100 rounded"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteItem('banner', b.id)"
                    class="p-2 hover:bg-red-100 text-red-500 rounded"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coupons -->
        <div v-else-if="activeTab === 'coupons'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">คูปอง</h2>
            <button
              @click="openModal('coupon')"
              class="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> เพิ่มคูปอง
            </button>
          </div>
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="text-left p-4">โค้ด</th>
                  <th class="text-left p-4">ส่วนลด</th>
                  <th class="text-left p-4">ขั้นต่ำ</th>
                  <th class="text-left p-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in coupons" :key="c.id" class="border-t">
                  <td class="p-4 font-mono">{{ c.code }}</td>
                  <td class="p-4">
                    {{
                      c.discount_type === "percent"
                        ? c.discount_value + "%"
                        : "฿" + c.discount_value
                    }}
                  </td>
                  <td class="p-4">฿{{ c.min_order }}</td>
                  <td class="p-4 flex gap-2">
                    <button
                      @click="openModal('coupon', 'edit', c)"
                      class="p-2 hover:bg-slate-100 rounded"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      @click="deleteItem('coupon', c.id)"
                      class="p-2 hover:bg-red-100 text-red-500 rounded"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl w-full max-w-md mx-4 p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">
            {{ modalMode === "add" ? "เพิ่ม" : "แก้ไข" }}
            {{
              modalType === "product"
                ? "สินค้า"
                : modalType === "category"
                ? "หมวดหมู่"
                : modalType === "banner"
                ? "แบนเนอร์"
                : "คูปอง"
            }}
          </h3>
          <button @click="closeModal" class="p-2 hover:bg-slate-100 rounded">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Product Form -->
        <div v-if="modalType === 'product'" class="space-y-4">
          <input
            v-model="productForm.name"
            placeholder="ชื่อสินค้า"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model.number="productForm.price"
            type="number"
            placeholder="ราคา"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model.number="productForm.original_price"
            type="number"
            placeholder="ราคาเดิม"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model="productForm.image"
            placeholder="URL รูปภาพ"
            class="w-full p-3 border rounded-lg"
          />
          <select
            v-model="productForm.category_id"
            class="w-full p-3 border rounded-lg"
          >
            <option value="">เลือกหมวดหมู่</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="productForm.is_flash_sale" /> Flash
            Sale
          </label>
        </div>

        <!-- Category Form -->
        <div v-else-if="modalType === 'category'" class="space-y-4">
          <input
            v-model="categoryForm.name"
            placeholder="ชื่อหมวดหมู่"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model="categoryForm.icon"
            placeholder="ไอคอน"
            class="w-full p-3 border rounded-lg"
          />
        </div>

        <!-- Banner Form -->
        <div v-else-if="modalType === 'banner'" class="space-y-4">
          <input
            v-model="bannerForm.title"
            placeholder="หัวข้อ"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model="bannerForm.subtitle"
            placeholder="รายละเอียด"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model="bannerForm.image"
            placeholder="URL รูปภาพ"
            class="w-full p-3 border rounded-lg"
          />
        </div>

        <!-- Coupon Form -->
        <div v-else class="space-y-4">
          <input
            v-model="couponForm.code"
            placeholder="โค้ดคูปอง"
            class="w-full p-3 border rounded-lg"
          />
          <select
            v-model="couponForm.discount_type"
            class="w-full p-3 border rounded-lg"
          >
            <option value="percent">เปอร์เซ็นต์</option>
            <option value="fixed">จำนวนเงิน</option>
          </select>
          <input
            v-model.number="couponForm.discount_value"
            type="number"
            placeholder="มูลค่าส่วนลด"
            class="w-full p-3 border rounded-lg"
          />
          <input
            v-model.number="couponForm.min_order"
            type="number"
            placeholder="ยอดขั้นต่ำ"
            class="w-full p-3 border rounded-lg"
          />
        </div>

        <button
          @click="saveItem"
          class="w-full mt-6 bg-green-700 text-white py-3 rounded-lg font-medium"
        >
          บันทึก
        </button>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div
      v-if="showOrderDetail && selectedOrder"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeOrderDetail"
    >
      <div
        class="bg-white rounded-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-auto"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">คำสั่งซื้อ #{{ selectedOrder.id }}</h3>
          <button
            @click="closeOrderDetail"
            class="p-2 hover:bg-slate-100 rounded"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <MapPin class="w-4 h-4" />
            <span>{{
              getOrderAddress(selectedOrder)?.address_line || "ไม่ระบุที่อยู่"
            }}</span>
          </div>
          <div class="border-t pt-4">
            <p class="font-medium mb-2">รายการสินค้า</p>
            <div
              v-for="item in selectedOrder.order_items"
              :key="item.id"
              class="flex justify-between py-2 border-b"
            >
              <span>{{ item.product_name }} x{{ item.quantity }}</span>
              <span>฿{{ item.subtotal }}</span>
            </div>
          </div>
          <div class="border-t pt-4 space-y-2">
            <div class="flex justify-between">
              <span>ยอดสินค้า</span><span>฿{{ selectedOrder.subtotal }}</span>
            </div>
            <div class="flex justify-between">
              <span>ค่าจัดส่ง</span
              ><span>฿{{ selectedOrder.delivery_fee }}</span>
            </div>
            <div class="flex justify-between">
              <span>ส่วนลด</span
              ><span class="text-red-500">-฿{{ selectedOrder.discount }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg">
              <span>รวมทั้งหมด</span><span>฿{{ selectedOrder.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
