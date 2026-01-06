import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import PromotionsView from '../views/PromotionsView.vue'
import CartView from '../views/CartView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import OrdersView from '../views/OrdersView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import AddAddressView from '../views/AddAddressView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import WishlistView from '../views/WishlistView.vue'
import EditProfileView from '../views/EditProfileView.vue'
import AddressesView from '../views/AddressesView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import SettingsView from '../views/SettingsView.vue'
import HelpView from '../views/HelpView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import AchievementsView from '../views/AchievementsView.vue'
import ReferralView from '../views/ReferralView.vue'
import TermsView from '../views/TermsView.vue'
import CouponsView from '../views/CouponsView.vue'
import PaymentMethodsView from '../views/PaymentMethodsView.vue'
import RewardsView from '../views/RewardsView.vue'
import LoyaltyView from '../views/LoyaltyView.vue'
import SearchView from '../views/SearchView.vue'
import DesignSystemView from '../views/DesignSystemView.vue'
import SubscriptionsView from '../views/SubscriptionsView.vue'
import SubscriptionEditView from '../views/SubscriptionEditView.vue'
import SubscriptionTiersView from '../views/SubscriptionTiersView.vue'
import TrackOrderView from '../views/TrackOrderView.vue'

// Admin Views
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import AdminCoupons from '../views/admin/AdminCoupons.vue'
import AdminCategories from '../views/admin/AdminCategories.vue'
import AdminBanners from '../views/admin/AdminBanners.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'
import AdminActivityLog from '../views/admin/AdminActivityLog.vue'
import AdminLoyalty from '../views/admin/AdminLoyalty.vue'
import AdminRewards from '../views/admin/AdminRewards.vue'
import AdminChallenges from '../views/admin/AdminChallenges.vue'
import AdminSubscriptions from '../views/admin/AdminSubscriptions.vue'
import AdminFlashSale from '../views/admin/AdminFlashSale.vue'
import AdminDeals from '../views/admin/AdminDeals.vue'

import { useAuthStore } from '../stores/auth'

const APP_NAME = '7-Eleven Store'

const routes = [
  { path: '/', redirect: '/customer' },
  
  // Customer routes
  { path: '/customer', name: 'home', component: HomeView, meta: { title: 'หน้าแรก' } },
  { path: '/customer/search', name: 'search', component: SearchView, meta: { title: 'ค้นหา' } },
  { path: '/customer/categories', name: 'categories', component: CategoriesView, meta: { title: 'หมวดหมู่สินค้า' } },
  { path: '/customer/promotions', name: 'promotions', component: PromotionsView, meta: { title: 'โปรโมชั่น' } },
  { path: '/customer/cart', name: 'cart', component: CartView, meta: { title: 'ตะกร้าสินค้า' } },
  { path: '/customer/profile', name: 'profile', component: ProfileView, meta: { title: 'โปรไฟล์' } },
  { path: '/customer/edit-profile', name: 'edit-profile', component: EditProfileView, meta: { requiresAuth: true, title: 'แก้ไขโปรไฟล์' } },
  { path: '/customer/addresses', name: 'addresses', component: AddressesView, meta: { requiresAuth: true, title: 'ที่อยู่จัดส่ง' } },
  { path: '/customer/notifications', name: 'notifications', component: NotificationsView, meta: { requiresAuth: true, title: 'การแจ้งเตือน' } },
  { path: '/customer/settings', name: 'settings', component: SettingsView, meta: { title: 'ตั้งค่า' } },
  { path: '/customer/help', name: 'help', component: HelpView, meta: { title: 'ศูนย์ช่วยเหลือ' } },
  { path: '/customer/privacy', name: 'privacy', component: PrivacyView, meta: { title: 'ความเป็นส่วนตัว' } },
  { path: '/customer/achievements', name: 'achievements', component: AchievementsView, meta: { requiresAuth: true, title: 'ความสำเร็จ' } },
  { path: '/customer/referral', name: 'referral', component: ReferralView, meta: { requiresAuth: true, title: 'แนะนำเพื่อน' } },
  { path: '/customer/coupons', name: 'coupons', component: CouponsView, meta: { requiresAuth: true, title: 'คูปองของฉัน' } },
  { path: '/customer/payment', name: 'payment', component: PaymentMethodsView, meta: { requiresAuth: true, title: 'วิธีการชำระเงิน' } },
  { path: '/customer/rewards', name: 'rewards', component: RewardsView, meta: { requiresAuth: true, title: 'แลกของรางวัล' } },
  { path: '/customer/loyalty', name: 'loyalty', component: LoyaltyView, meta: { requiresAuth: true, title: 'โปรแกรมสะสมคะแนน' } },
  { path: '/customer/subscriptions', name: 'subscriptions', component: SubscriptionsView, meta: { requiresAuth: true, title: 'สั่งซื้ออัตโนมัติ' } },
  { path: '/customer/subscriptions/new', name: 'subscription-new', component: SubscriptionEditView, meta: { requiresAuth: true, title: 'สร้างรายการใหม่' } },
  { path: '/customer/subscriptions/:id', name: 'subscription-edit', component: SubscriptionEditView, meta: { requiresAuth: true, title: 'แก้ไขรายการ' } },
  { path: '/customer/subscription-tiers', name: 'subscription-tiers', component: SubscriptionTiersView, meta: { requiresAuth: true, title: 'ระดับสมาชิก Subscription' } },
  { path: '/customer/terms', name: 'terms', component: TermsView, meta: { title: 'เงื่อนไขการใช้งาน' } },
  { path: '/customer/wishlist', name: 'wishlist', component: WishlistView, meta: { title: 'รายการโปรด' } },
  { path: '/customer/login', name: 'login', component: LoginView, meta: { title: 'เข้าสู่ระบบ' } },
  { path: '/customer/register', name: 'register', component: RegisterView, meta: { title: 'สมัครสมาชิก' } },
  { path: '/customer/orders', name: 'orders', component: OrdersView, meta: { requiresAuth: true, title: 'ประวัติคำสั่งซื้อ' } },
  { path: '/customer/order/:id', name: 'order-detail', component: OrderDetailView, meta: { requiresAuth: true, title: 'รายละเอียดคำสั่งซื้อ' } },
  { path: '/customer/track-order', name: 'track-order', component: TrackOrderView, meta: { title: 'ติดตามคำสั่งซื้อ' } },
  { path: '/customer/checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true, title: 'ชำระเงิน' } },
  { path: '/customer/add-address', name: 'add-address', component: AddAddressView, meta: { requiresAuth: true, title: 'เพิ่มที่อยู่' } },
  { path: '/customer/product/:id', name: 'product-detail', component: ProductDetailView, meta: { title: 'รายละเอียดสินค้า' } },
  
  // Design System (public)
  { path: '/design-system', name: 'design-system', component: DesignSystemView, meta: { title: 'Design System' } },
  
  // Admin Login (public)
  { path: '/admin/login', name: 'admin-login', component: AdminLogin, meta: { title: 'Admin Login' } },
  
  // Admin routes (protected)
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboard, meta: { title: 'แดชบอร์ด', requiresAdmin: true } },
      { path: 'products', name: 'admin-products', component: AdminProducts, meta: { title: 'จัดการสินค้า', requiresAdmin: true } },
      { path: 'orders', name: 'admin-orders', component: AdminOrders, meta: { title: 'จัดการคำสั่งซื้อ', requiresAdmin: true } },
      { path: 'coupons', name: 'admin-coupons', component: AdminCoupons, meta: { title: 'จัดการคูปอง', requiresAdmin: true } },
      { path: 'categories', name: 'admin-categories', component: AdminCategories, meta: { title: 'จัดการหมวดหมู่', requiresAdmin: true } },
      { path: 'banners', name: 'admin-banners', component: AdminBanners, meta: { title: 'จัดการแบนเนอร์', requiresAdmin: true } },
      { path: 'users', name: 'admin-users', component: AdminUsers, meta: { title: 'จัดการผู้ใช้', requiresAdmin: true } },
      { path: 'activity', name: 'admin-activity', component: AdminActivityLog, meta: { title: 'Activity Log', requiresAdmin: true } },
      { path: 'loyalty', name: 'admin-loyalty', component: AdminLoyalty, meta: { title: 'Loyalty Program', requiresAdmin: true } },
      { path: 'loyalty/rewards', name: 'admin-rewards', component: AdminRewards, meta: { title: 'จัดการรางวัล', requiresAdmin: true } },
      { path: 'loyalty/challenges', name: 'admin-challenges', component: AdminChallenges, meta: { title: 'จัดการภารกิจ', requiresAdmin: true } },
      { path: 'subscriptions', name: 'admin-subscriptions', component: AdminSubscriptions, meta: { title: 'Subscription Analytics', requiresAdmin: true } },
      { path: 'flash-sale', name: 'admin-flash-sale', component: AdminFlashSale, meta: { title: 'จัดการ Flash Sale', requiresAdmin: true } },
      { path: 'deals', name: 'admin-deals', component: AdminDeals, meta: { title: 'จัดการ Deal/Bundle', requiresAdmin: true } },
    ]
  },
  
  // 404 - redirect to home
  { path: '/:pathMatch(.*)*', redirect: '/customer' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// Wait for auth to be ready
let authInitialized = false

async function waitForAuth() {
  if (authInitialized) return
  
  const authStore = useAuthStore()
  
  // If already initialized, return
  if (!authStore.loading) {
    authInitialized = true
    return
  }
  
  // Wait for loading to complete
  await new Promise(resolve => {
    const checkLoading = setInterval(() => {
      if (!authStore.loading) {
        clearInterval(checkLoading)
        authInitialized = true
        resolve()
      }
    }, 50)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkLoading)
      authInitialized = true
      resolve()
    }, 5000)
  })
}

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  // Set page title
  const title = to.meta.title || 'หน้าแรก'
  document.title = `${title} | ${APP_NAME}`
  
  // Check admin auth - use RBAC from Supabase
  if (to.meta.requiresAdmin) {
    // First check sessionStorage for admin_users table login (legacy)
    const adminAuth = sessionStorage.getItem('admin_authenticated')
    if (adminAuth) {
      return next()
    }
    
    // Then check Supabase auth with admin role
    await waitForAuth()
    const authStore = useAuthStore()
    
    if (authStore.isLoggedIn && authStore.isAdmin) {
      return next()
    }
    
    return next({ path: '/admin/login' })
  }
  
  // Check customer auth - wait for auth to initialize first
  if (to.meta.requiresAuth) {
    await waitForAuth()
    
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      return next({ path: '/customer/login', query: { redirect: to.fullPath } })
    }
  }
  
  next()
})

export default router
