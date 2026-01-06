import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Composable สำหรับ migrate รูปภาพจาก external URLs ไปยัง Supabase Storage
 */
export function useImageMigration() {
  const migrating = ref(false)
  const progress = ref({ current: 0, total: 0, success: 0, failed: 0 })
  const errors = ref([])
  const logs = ref([])

  // ตรวจสอบว่าเป็น external URL หรือไม่
  const isExternalUrl = (url) => {
    if (!url) return false
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return url.startsWith('http') && !url.includes(supabaseUrl)
  }

  // ดึงสินค้าที่มี external image URLs
  const getProductsWithExternalImages = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image, images')
    
    if (error) throw error

    return data.filter(p => {
      const hasExternalMain = isExternalUrl(p.image)
      const hasExternalImages = p.images?.some(img => isExternalUrl(img))
      return hasExternalMain || hasExternalImages
    })
  }

  // Download รูปภาพจาก URL
  const downloadImage = async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    return await response.blob()
  }

  // Upload รูปภาพไปยัง Supabase Storage
  const uploadToStorage = async (blob, filename) => {
    const { error } = await supabase.storage
      .from('products')
      .upload(filename, blob, { cacheControl: '3600', upsert: true })
    
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filename)
    
    return publicUrl
  }

  // Migrate รูปภาพเดียว
  const migrateImage = async (url, productId) => {
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
    const filename = `migrated-${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    
    const blob = await downloadImage(url)
    return await uploadToStorage(blob, filename)
  }

  // Migrate สินค้าทั้งหมด
  const migrateAllProducts = async () => {
    migrating.value = true
    errors.value = []
    logs.value = []
    progress.value = { current: 0, total: 0, success: 0, failed: 0 }

    try {
      const products = await getProductsWithExternalImages()
      progress.value.total = products.length
      logs.value.push(`พบ ${products.length} สินค้าที่มี external images`)

      for (const product of products) {
        progress.value.current++
        logs.value.push(`กำลัง migrate: ${product.name}`)

        try {
          const updates = {}

          // Migrate main image
          if (isExternalUrl(product.image)) {
            updates.image = await migrateImage(product.image, product.id)
          }

          // Migrate images array
          if (product.images?.length > 0) {
            const newImages = []
            for (const img of product.images) {
              if (isExternalUrl(img)) {
                newImages.push(await migrateImage(img, product.id))
              } else {
                newImages.push(img)
              }
            }
            updates.images = newImages
          }

          // Update product in database
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('products')
              .update(updates)
              .eq('id', product.id)
            
            if (error) throw error
            progress.value.success++
            logs.value.push(`✅ สำเร็จ: ${product.name}`)
          }
        } catch (err) {
          progress.value.failed++
          errors.value.push({ product: product.name, error: err.message })
          logs.value.push(`❌ ล้มเหลว: ${product.name} - ${err.message}`)
        }
      }

      logs.value.push(`\n=== สรุป ===`)
      logs.value.push(`สำเร็จ: ${progress.value.success}/${progress.value.total}`)
      logs.value.push(`ล้มเหลว: ${progress.value.failed}/${progress.value.total}`)

    } catch (err) {
      errors.value.push({ product: 'System', error: err.message })
      logs.value.push(`❌ System Error: ${err.message}`)
    } finally {
      migrating.value = false
    }
  }

  // สถิติ
  const stats = computed(() => ({
    ...progress.value,
    percent: progress.value.total > 0 
      ? Math.round((progress.value.current / progress.value.total) * 100) 
      : 0
  }))

  return {
    migrating,
    progress,
    errors,
    logs,
    stats,
    isExternalUrl,
    getProductsWithExternalImages,
    migrateAllProducts
  }
}
