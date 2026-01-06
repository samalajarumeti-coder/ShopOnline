<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useAdminStore } from "../../stores/admin"
import { supabase } from "../../lib/supabase"
import { useDragDrop } from "../../composables/useDragDrop"
import { Zap, Plus, Trash2, X, Loader2, Search, Clock, Calendar, GripVertical, Settings, CalendarPlus, Play, Pause, Bell, Copy, BookTemplate } from "lucide-vue-next"

const adminStore = useAdminStore()
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref("")
const showAddModal = ref(false)
const showSettingsModal = ref(false)
const showScheduleModal = ref(false)
const showTemplateModal = ref(false)
const activeTab = ref("current")
const { draggedIndex, dropTargetIndex, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragDrop()
const flashSaleSettings = ref({ end_time: "", is_active: true })
const scheduledSales = ref([])
const templates = ref([])
const newSchedule = ref({ name: "", start_time: "", end_time: "", product_ids: [], notify_before: 60, is_active: true })
const newTemplate = ref({ name: "", description: "", product_ids: [], default_duration: 24, default_notify_before: 60 })
const flashSaleProducts = computed(() => adminStore.products.filter((p) => p.is_flash_sale && p.is_active).sort((a, b) => (a.flash_sale_order || 999) - (b.flash_sale_order || 999)))
const availableProducts = computed(() => { let result = adminStore.products.filter((p) => !p.is_flash_sale && p.is_active); if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter((p) => p.name?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q)) } return result.slice(0, 20) })
const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 })
let timerInterval = null
const updateTimer = () => { const now = new Date(); let endTime = flashSaleSettings.value.end_time ? new Date(flashSaleSettings.value.end_time) : new Date(); if (!flashSaleSettings.value.end_time) endTime.setHours(24, 0, 0, 0); const diff = Math.max(0, endTime - now); timeLeft.value = { hours: Math.floor(diff / (1000 * 60 * 60)), minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)), seconds: Math.floor((diff % (1000 * 60)) / 1000) } }
onMounted(async () => { loading.value = true; await Promise.all([adminStore.fetchAllProducts(), loadFlashSaleSettings(), loadScheduledSales(), loadTemplates()]); loading.value = false; updateTimer(); timerInterval = setInterval(updateTimer, 1000) })
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
async function loadFlashSaleSettings() { try { const { data } = await supabase.from("app_settings").select("*").eq("key", "flash_sale").single(); if (data?.value) flashSaleSettings.value = data.value } catch (err) { /* not found */ } }
async function loadScheduledSales() { const { data } = await supabase.from("scheduled_flash_sales").select("*").order("start_time", { ascending: true }); if (data) scheduledSales.value = data }
async function loadTemplates() { const { data } = await supabase.from("flash_sale_templates").select("*").eq("is_active", true).order("use_count", { ascending: false }); if (data) templates.value = data }
async function saveFlashSaleSettings() { saving.value = true; try { await supabase.from("app_settings").upsert({ key: "flash_sale", value: flashSaleSettings.value, updated_at: new Date().toISOString() }); showSettingsModal.value = false } catch (err) { alert("บันทึกไม่สำเร็จ: " + err.message) } finally { saving.value = false } }
async function addToFlashSale(product) { const maxOrder = Math.max(0, ...flashSaleProducts.value.map((p) => p.flash_sale_order || 0)); await adminStore.updateProduct(product.id, { is_flash_sale: true, flash_sale_order: maxOrder + 1 }) }
async function removeFromFlashSale(product) { if (!confirm("ลบ " + product.name + " ออกจาก Flash Sale?")) return; await adminStore.updateProduct(product.id, { is_flash_sale: false, flash_sale_order: null }) }
async function handleReorder(newItems) { const updates = newItems.map((item, index) => ({ id: item.id, flash_sale_order: index + 1 })); await Promise.all(updates.map((u) => adminStore.updateProduct(u.id, { flash_sale_order: u.flash_sale_order }))) }
async function clearAllFlashSale() { if (!confirm("ยืนยันการล้าง Flash Sale ทั้งหมด?")) return; saving.value = true; await Promise.all(flashSaleProducts.value.map((p) => adminStore.updateProduct(p.id, { is_flash_sale: false, flash_sale_order: null }))); saving.value = false }
async function createScheduledSale() { if (!newSchedule.value.name || !newSchedule.value.start_time || !newSchedule.value.end_time) { alert("กรุณากรอกข้อมูลให้ครบ"); return } saving.value = true; try { const { data, error } = await supabase.from("scheduled_flash_sales").insert({ name: newSchedule.value.name, start_time: newSchedule.value.start_time, end_time: newSchedule.value.end_time, product_ids: newSchedule.value.product_ids, notify_before: newSchedule.value.notify_before, is_active: true }).select().single(); if (error) throw error; scheduledSales.value.push(data); showScheduleModal.value = false; resetNewSchedule() } catch (err) { alert("สร้างไม่สำเร็จ: " + err.message) } finally { saving.value = false } }
async function toggleScheduledSale(sale) { await supabase.from("scheduled_flash_sales").update({ is_active: !sale.is_active }).eq("id", sale.id); sale.is_active = !sale.is_active }
async function deleteScheduledSale(sale) { if (!confirm("ลบ " + sale.name + "?")) return; await supabase.from("scheduled_flash_sales").delete().eq("id", sale.id); scheduledSales.value = scheduledSales.value.filter((s) => s.id !== sale.id) }
function copyFromPrevious(sale) { newSchedule.value = { name: sale.name + " (สำเนา)", start_time: "", end_time: "", product_ids: [...(sale.product_ids || [])], notify_before: sale.notify_before, is_active: true }; showScheduleModal.value = true }
function resetNewSchedule() { newSchedule.value = { name: "", start_time: "", end_time: "", product_ids: [], notify_before: 60, is_active: true } }
function toggleProductInSchedule(productId) { const idx = newSchedule.value.product_ids.indexOf(productId); if (idx === -1) newSchedule.value.product_ids.push(productId); else newSchedule.value.product_ids.splice(idx, 1) }
async function createTemplate() { if (!newTemplate.value.name) { alert("กรุณาใส่ชื่อ Template"); return } saving.value = true; try { const { data, error } = await supabase.from("flash_sale_templates").insert({ name: newTemplate.value.name, description: newTemplate.value.description, product_ids: newTemplate.value.product_ids, default_duration: newTemplate.value.default_duration, default_notify_before: newTemplate.value.default_notify_before, is_active: true }).select().single(); if (error) throw error; templates.value.unshift(data); showTemplateModal.value = false; resetNewTemplate() } catch (err) { alert("สร้างไม่สำเร็จ: " + err.message) } finally { saving.value = false } }
async function useTemplate(template) { const now = new Date(); const endTime = new Date(now.getTime() + template.default_duration * 60 * 60 * 1000); newSchedule.value = { name: template.name, start_time: now.toISOString().slice(0, 16), end_time: endTime.toISOString().slice(0, 16), product_ids: [...(template.product_ids || [])], notify_before: template.default_notify_before, is_active: true }; await supabase.from("flash_sale_templates").update({ use_count: (template.use_count || 0) + 1 }).eq("id", template.id); showScheduleModal.value = true }
async function saveCurrentAsTemplate() { if (flashSaleProducts.value.length === 0) { alert("ไม่มีสินค้าใน Flash Sale"); return } newTemplate.value = { name: "Flash Sale " + new Date().toLocaleDateString("th-TH"), description: "", product_ids: flashSaleProducts.value.map((p) => p.id), default_duration: 24, default_notify_before: 60 }; showTemplateModal.value = true }
async function deleteTemplate(template) { if (!confirm("ลบ Template " + template.name + "?")) return; await supabase.from("flash_sale_templates").delete().eq("id", template.id); templates.value = templates.value.filter((t) => t.id !== template.id) }
function resetNewTemplate() { newTemplate.value = { name: "", description: "", product_ids: [], default_duration: 24, default_notify_before: 60 } }
function toggleProductInTemplate(productId) { const idx = newTemplate.value.product_ids.indexOf(productId); if (idx === -1) newTemplate.value.product_ids.push(productId); else newTemplate.value.product_ids.splice(idx, 1) }
const pad = (n) => String(n).padStart(2, "0")
const getDiscount = (product) => product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0
const formatCurrency = (val) => new Intl.NumberFormat("th-TH").format(val)
const formatDateTime = (dt) => dt ? new Date(dt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-"
const getScheduleStatus = (sale) => { const now = new Date(), start = new Date(sale.start_time), end = new Date(sale.end_time); if (now < start) return { label: "รอเริ่ม", color: "bg-yellow-100 text-yellow-700" }; if (now >= start && now <= end) return { label: "กำลังดำเนินการ", color: "bg-green-100 text-green-700" }; return { label: "สิ้นสุดแล้ว", color: "bg-gray-100 text-gray-500" } }
</script>

<template>
<div>
<div class="flex flex-wrap justify-between items-center gap-3 mb-4">
<div><h1 class="text-2xl font-bold flex items-center gap-2"><Zap class="w-6 h-6 text-orange-500 fill-orange-500" />จัดการ Flash Sale</h1><p class="text-sm text-gray-500">{{ flashSaleProducts.length }} สินค้าใน Flash Sale</p></div>
<div class="flex gap-2 flex-wrap">
<button v-if="flashSaleProducts.length > 0" @click="saveCurrentAsTemplate" class="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"><BookTemplate class="w-4 h-4" />บันทึก Template</button>
<button @click="showScheduleModal = true" class="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"><CalendarPlus class="w-4 h-4" />ตั้งเวลา</button>
<button @click="showSettingsModal = true" class="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"><Settings class="w-4 h-4" />ตั้งค่า</button>
<button @click="showAddModal = true" class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"><Plus class="w-4 h-4" />เพิ่มสินค้า</button>
</div>
</div>
<div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-4 text-white">
<div class="flex items-center justify-between flex-wrap gap-3">
<div class="flex items-center gap-3"><Clock class="w-8 h-8" /><div><p class="text-sm opacity-90">Flash Sale จบใน</p><div class="flex items-center gap-1 text-2xl font-bold font-mono"><span class="bg-white/20 px-2 py-1 rounded">{{ pad(timeLeft.hours) }}</span>:<span class="bg-white/20 px-2 py-1 rounded">{{ pad(timeLeft.minutes) }}</span>:<span class="bg-white/20 px-2 py-1 rounded">{{ pad(timeLeft.seconds) }}</span></div></div></div>
<span :class="['inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium', flashSaleSettings.is_active ? 'bg-green-400/30' : 'bg-gray-400/30']"><span :class="['w-2 h-2 rounded-full', flashSaleSettings.is_active ? 'bg-green-400' : 'bg-gray-400']"></span>{{ flashSaleSettings.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน" }}</span>
</div>
</div>
<div class="flex gap-2 mb-4 flex-wrap">
<button @click="activeTab = 'current'" :class="['px-4 py-2 rounded-lg font-medium', activeTab === 'current' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"><Zap class="w-4 h-4 inline mr-1" />Flash Sale ปัจจุบัน</button>
<button @click="activeTab = 'scheduled'" :class="['px-4 py-2 rounded-lg font-medium', activeTab === 'scheduled' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"><Calendar class="w-4 h-4 inline mr-1" />ตั้งเวลา ({{ scheduledSales.length }})</button>
<button @click="activeTab = 'templates'" :class="['px-4 py-2 rounded-lg font-medium', activeTab === 'templates' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"><BookTemplate class="w-4 h-4 inline mr-1" />Templates ({{ templates.length }})</button>
</div>
<div v-if="activeTab === 'current'" class="bg-white rounded-xl shadow-sm overflow-hidden">
<div class="p-4 border-b flex items-center justify-between"><div><h2 class="font-semibold">สินค้า Flash Sale</h2><p class="text-xs text-gray-500">ลากเพื่อจัดลำดับ</p></div><button v-if="flashSaleProducts.length > 0" @click="clearAllFlashSale" :disabled="saving" class="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 class="w-4 h-4" />ล้างทั้งหมด</button></div>
<div v-if="loading" class="p-8 text-center text-gray-500"><Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />กำลังโหลด...</div>
<div v-else-if="flashSaleProducts.length === 0" class="p-8 text-center text-gray-500"><Zap class="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>ยังไม่มีสินค้าใน Flash Sale</p><button @click="showAddModal = true" class="mt-3 text-orange-600 hover:text-orange-700 font-medium">+ เพิ่มสินค้า</button></div>
<div v-else class="divide-y">
<div v-for="(product, index) in flashSaleProducts" :key="product.id" draggable="true" @dragstart="handleDragStart(product, index)" @dragover="(e) => handleDragOver(e, index)" @dragleave="handleDragLeave" @drop="(e) => handleDrop(e, flashSaleProducts, handleReorder)" @dragend="handleDragEnd" :class="['flex items-center gap-4 p-4 hover:bg-gray-50 cursor-move transition-all', dropTargetIndex === index ? 'bg-orange-50 border-t-2 border-orange-500' : '', draggedIndex === index ? 'opacity-50' : '']">
<GripVertical class="w-5 h-5 text-gray-400" />
<span class="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
<img :src="product.image || '/placeholder-product.svg'" class="w-14 h-14 object-cover rounded-lg bg-gray-100" />
<div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate">{{ product.name }}</p><div class="flex items-center gap-2 mt-1"><span class="text-green-600 font-bold">{{ formatCurrency(product.price) }}</span><span v-if="product.original_price" class="text-gray-400 text-sm line-through">{{ formatCurrency(product.original_price) }}</span><span v-if="getDiscount(product) > 0" class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">-{{ getDiscount(product) }}%</span></div></div>
<button @click="removeFromFlashSale(product)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 class="w-5 h-5" /></button>
</div>
</div>
</div>
<div v-if="activeTab === 'scheduled'" class="bg-white rounded-xl shadow-sm overflow-hidden">
<div class="p-4 border-b"><h2 class="font-semibold">Flash Sale ที่ตั้งเวลาไว้</h2></div>
<div v-if="scheduledSales.length === 0" class="p-8 text-center text-gray-500"><Calendar class="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>ยังไม่มี Flash Sale ที่ตั้งเวลาไว้</p><button @click="showScheduleModal = true" class="mt-3 text-purple-600 font-medium">+ ตั้งเวลา Flash Sale</button></div>
<div v-else class="divide-y">
<div v-for="sale in scheduledSales" :key="sale.id" class="p-4 hover:bg-gray-50">
<div class="flex items-start justify-between">
<div class="flex-1"><div class="flex items-center gap-2"><h3 class="font-medium">{{ sale.name }}</h3><span :class="['text-xs px-2 py-0.5 rounded-full', getScheduleStatus(sale).color]">{{ getScheduleStatus(sale).label }}</span></div><div class="mt-2 text-sm text-gray-600 space-y-1"><p class="flex items-center gap-2"><Clock class="w-4 h-4" />{{ formatDateTime(sale.start_time) }} - {{ formatDateTime(sale.end_time) }}</p><p class="flex items-center gap-2"><Bell class="w-4 h-4" />แจ้งเตือนก่อน {{ sale.notify_before }} นาที</p><p class="text-xs text-gray-500">{{ sale.product_ids?.length || 0 }} สินค้า</p></div></div>
<div class="flex items-center gap-1"><button @click="copyFromPrevious(sale)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="คัดลอก"><Copy class="w-4 h-4" /></button><button @click="toggleScheduledSale(sale)" :class="['p-2 rounded-lg', sale.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100']"><Pause v-if="sale.is_active" class="w-4 h-4" /><Play v-else class="w-4 h-4" /></button><button @click="deleteScheduledSale(sale)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 class="w-4 h-4" /></button></div>
</div>
</div>
</div>
</div>
<div v-if="activeTab === 'templates'" class="bg-white rounded-xl shadow-sm overflow-hidden">
<div class="p-4 border-b flex items-center justify-between"><div><h2 class="font-semibold">Flash Sale Templates</h2><p class="text-xs text-gray-500">บันทึกรูปแบบที่ใช้บ่อย</p></div><button @click="showTemplateModal = true" class="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"><Plus class="w-4 h-4" />สร้าง Template</button></div>
<div v-if="templates.length === 0" class="p-8 text-center text-gray-500"><BookTemplate class="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>ยังไม่มี Template</p></div>
<div v-else class="divide-y">
<div v-for="template in templates" :key="template.id" class="p-4 hover:bg-gray-50">
<div class="flex items-center justify-between"><div><h3 class="font-medium">{{ template.name }}</h3><p class="text-sm text-gray-500">{{ template.description || '-' }}</p><p class="text-xs text-gray-400 mt-1">{{ template.product_ids?.length || 0 }} สินค้า - ใช้แล้ว {{ template.use_count || 0 }} ครั้ง</p></div><div class="flex items-center gap-2"><button @click="useTemplate(template)" class="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">ใช้งาน</button><button @click="deleteTemplate(template)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 class="w-4 h-4" /></button></div></div>
</div>
</div>
</div>
<div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
<div class="flex justify-between items-center p-4 border-b"><h3 class="text-lg font-semibold">เพิ่มสินค้าใน Flash Sale</h3><button @click="showAddModal = false" class="p-1 hover:bg-gray-100 rounded-lg"><X class="w-6 h-6" /></button></div>
<div class="p-4 border-b"><div class="relative"><Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="searchQuery" type="text" placeholder="ค้นหาสินค้า..." class="w-full pl-10 pr-4 py-2 border rounded-lg" /></div></div>
<div class="flex-1 overflow-y-auto divide-y">
<div v-for="product in availableProducts" :key="product.id" class="flex items-center gap-3 p-3 hover:bg-gray-50">
<img :src="product.image || '/placeholder-product.svg'" class="w-12 h-12 object-cover rounded-lg bg-gray-100" />
<div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate text-sm">{{ product.name }}</p><span class="text-green-600 font-bold text-sm">{{ formatCurrency(product.price) }}</span></div>
<button @click="addToFlashSale(product)" class="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"><Plus class="w-4 h-4 inline" /> เพิ่ม</button>
</div>
</div>
</div>
</div>
<div v-if="showSettingsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-xl w-full max-w-md">
<div class="flex justify-between items-center p-4 border-b"><h3 class="text-lg font-semibold"><Settings class="w-5 h-5 inline mr-2" />ตั้งค่า Flash Sale</h3><button @click="showSettingsModal = false" class="p-1 hover:bg-gray-100 rounded-lg"><X class="w-6 h-6" /></button></div>
<div class="p-4 space-y-4"><div><label class="block text-sm font-medium mb-2">เวลาสิ้นสุด Flash Sale</label><input v-model="flashSaleSettings.end_time" type="datetime-local" class="w-full border rounded-lg px-3 py-2" /></div><label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input v-model="flashSaleSettings.is_active" type="checkbox" class="w-5 h-5 rounded text-orange-600" /><span class="text-sm font-medium">เปิดใช้งาน Flash Sale</span></label></div>
<div class="flex gap-3 p-4 border-t"><button @click="showSettingsModal = false" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button><button @click="saveFlashSaleSettings" :disabled="saving" class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"><Loader2 v-if="saving" class="w-4 h-4 animate-spin inline mr-1" />บันทึก</button></div>
</div>
</div>
<div v-if="showScheduleModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
<div class="flex justify-between items-center p-4 border-b"><h3 class="text-lg font-semibold"><CalendarPlus class="w-5 h-5 inline mr-2 text-purple-500" />ตั้งเวลา Flash Sale</h3><button @click="showScheduleModal = false; resetNewSchedule()" class="p-1 hover:bg-gray-100 rounded-lg"><X class="w-6 h-6" /></button></div>
<div class="flex-1 overflow-y-auto p-4 space-y-4">
<div><label class="block text-sm font-medium mb-2">ชื่อ Flash Sale *</label><input v-model="newSchedule.name" type="text" placeholder="เช่น Flash Sale วันหยุด" class="w-full border rounded-lg px-3 py-2" /></div>
<div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-2">เริ่มต้น *</label><input v-model="newSchedule.start_time" type="datetime-local" class="w-full border rounded-lg px-3 py-2" /></div><div><label class="block text-sm font-medium mb-2">สิ้นสุด *</label><input v-model="newSchedule.end_time" type="datetime-local" class="w-full border rounded-lg px-3 py-2" /></div></div>
<div><label class="block text-sm font-medium mb-2">แจ้งเตือนลูกค้าก่อน</label><select v-model="newSchedule.notify_before" class="w-full border rounded-lg px-3 py-2"><option :value="15">15 นาที</option><option :value="30">30 นาที</option><option :value="60">1 ชั่วโมง</option><option :value="120">2 ชั่วโมง</option><option :value="1440">1 วัน</option></select></div>
<div><label class="block text-sm font-medium mb-2">เลือกสินค้า ({{ newSchedule.product_ids.length }})</label><div class="border rounded-lg max-h-48 overflow-y-auto"><div v-for="product in adminStore.products.filter(p => p.is_active)" :key="product.id" @click="toggleProductInSchedule(product.id)" :class="['flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50', newSchedule.product_ids.includes(product.id) ? 'bg-purple-50' : '']"><input type="checkbox" :checked="newSchedule.product_ids.includes(product.id)" class="w-4 h-4 rounded text-purple-600" @click.stop /><img :src="product.image || '/placeholder-product.svg'" class="w-8 h-8 object-cover rounded" /><span class="text-sm truncate flex-1">{{ product.name }}</span><span class="text-xs text-green-600 font-medium">{{ product.price }}</span></div></div></div>
</div>
<div class="flex gap-3 p-4 border-t"><button @click="showScheduleModal = false; resetNewSchedule()" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button><button @click="createScheduledSale" :disabled="saving || !newSchedule.name || !newSchedule.start_time || !newSchedule.end_time" class="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"><Loader2 v-if="saving" class="w-4 h-4 animate-spin inline mr-1" />สร้าง</button></div>
</div>
</div>
<div v-if="showTemplateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
<div class="flex justify-between items-center p-4 border-b"><h3 class="text-lg font-semibold"><BookTemplate class="w-5 h-5 inline mr-2 text-blue-500" />สร้าง Template</h3><button @click="showTemplateModal = false; resetNewTemplate()" class="p-1 hover:bg-gray-100 rounded-lg"><X class="w-6 h-6" /></button></div>
<div class="flex-1 overflow-y-auto p-4 space-y-4">
<div><label class="block text-sm font-medium mb-2">ชื่อ Template *</label><input v-model="newTemplate.name" type="text" placeholder="เช่น Flash Sale สินค้าเครื่องดื่ม" class="w-full border rounded-lg px-3 py-2" /></div>
<div><label class="block text-sm font-medium mb-2">รายละเอียด</label><textarea v-model="newTemplate.description" rows="2" placeholder="อธิบาย Template นี้..." class="w-full border rounded-lg px-3 py-2"></textarea></div>
<div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-2">ระยะเวลา (ชั่วโมง)</label><input v-model="newTemplate.default_duration" type="number" min="1" class="w-full border rounded-lg px-3 py-2" /></div><div><label class="block text-sm font-medium mb-2">แจ้งเตือนก่อน (นาที)</label><input v-model="newTemplate.default_notify_before" type="number" min="0" class="w-full border rounded-lg px-3 py-2" /></div></div>
<div><label class="block text-sm font-medium mb-2">เลือกสินค้า ({{ newTemplate.product_ids.length }})</label><div class="border rounded-lg max-h-48 overflow-y-auto"><div v-for="product in adminStore.products.filter(p => p.is_active)" :key="product.id" @click="toggleProductInTemplate(product.id)" :class="['flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50', newTemplate.product_ids.includes(product.id) ? 'bg-blue-50' : '']"><input type="checkbox" :checked="newTemplate.product_ids.includes(product.id)" class="w-4 h-4 rounded text-blue-600" @click.stop /><img :src="product.image || '/placeholder-product.svg'" class="w-8 h-8 object-cover rounded" /><span class="text-sm truncate flex-1">{{ product.name }}</span></div></div></div>
</div>
<div class="flex gap-3 p-4 border-t"><button @click="showTemplateModal = false; resetNewTemplate()" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button><button @click="createTemplate" :disabled="saving || !newTemplate.name" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"><Loader2 v-if="saving" class="w-4 h-4 animate-spin inline mr-1" />บันทึก</button></div>
</div>
</div>
</div>
</template>
