import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * CDN Cache Purge สำหรับ Supabase Storage
 * ใช้วิธี re-upload ไฟล์เดิมเพื่อ invalidate cache
 */
export function useCachePurge() {
  const purging = ref(false)
  const logs = ref([])

  /**
   * Extract filename จาก Supabase Storage URL
   */
  const extractFilename = (url) => {
    if (!url) return null
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  }

  /**
   * Purge cache ของไฟล์เดียว โดย re-upload ด้วย timestamp ใหม่
   */
  const purgeFile = async (url, bucket = 'products') => {
    const filename = extractFilename(url)
    if (!filename) throw new Error('Invalid storage URL')

    // Download ไฟล์เดิม
    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filename)

    if (downloadError) throw downloadError

    // Re-upload ด้วย cache control ใหม่
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .update(filename, blob, {
        cacheControl: '0', // No cache temporarily
        upsert: true
      })

    if (uploadError) throw uploadError

    // Set cache control กลับเป็นปกติ
    await supabase.storage
      .from(bucket)
      .update(filename, blob, {
        cacheControl: '31536000',
        upsert: true
      })

    return true
  }

  /**
   * Purge cache ของสินค้า (ทุกรูปภาพ)
   */
  const purgeProductImages = async (product, bucket = 'products') => {
    purging.value = true
    logs.value = []

    try {
      const urls = []

      // รวบรวม URLs ทั้งหมด
      if (product.image) urls.push(product.image)
      if (product.images?.length) urls.push(...product.images)

      logs.value.push(`พบ ${urls.length} รูปภาพ`)

      let success = 0
      let failed = 0

      for (const url of urls) {
        try {
          // ตรวจสอบว่าเป็น Supabase URL หรือไม่
          if (!url.includes('supabase')) {
            logs.value.push(`⏭️ ข้าม external URL: ${url.substring(0, 50)}...`)
            continue
          }

          await purgeFile(url, bucket)
          success++
          logs.value.push(`✅ Purged: ${extractFilename(url)}`)
        } catch (err) {
          failed++
          logs.value.push(`❌ Failed: ${err.message}`)
        }
      }

      logs.value.push(`\n=== สรุป ===`)
      logs.value.push(`สำเร็จ: ${success}, ล้มเหลว: ${failed}`)

      return { success, failed }
    } finally {
      purging.value = false
    }
  }

  /**
   * Purge cache ทั้ง bucket (ใช้เวลานาน)
   */
  const purgeBucket = async (bucket = 'products') => {
    purging.value = true
    logs.value = []

    try {
      // List all files
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })

      if (error) throw error

      logs.value.push(`พบ ${files.length} ไฟล์ใน bucket`)

      let success = 0
      let failed = 0

      for (const file of files) {
        if (file.id) { // Skip folders
          try {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(file.name)

            await purgeFile(publicUrl, bucket)
            success++
            logs.value.push(`✅ ${file.name}`)
          } catch (err) {
            failed++
            logs.value.push(`❌ ${file.name}: ${err.message}`)
          }
        }
      }

      logs.value.push(`\n=== สรุป ===`)
      logs.value.push(`สำเร็จ: ${success}, ล้มเหลว: ${failed}`)

      return { success, failed }
    } finally {
      purging.value = false
    }
  }

  /**
   * เพิ่ม cache-busting query string
   */
  const addCacheBuster = (url) => {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${Date.now()}`
  }

  return {
    purging,
    logs,
    purgeFile,
    purgeProductImages,
    purgeBucket,
    addCacheBuster,
    extractFilename
  }
}
