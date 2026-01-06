import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useImageValidator() {
  const validating = ref(false)
  const scanProgress = ref({ current: 0, total: 0, percent: 0 })
  const brokenImages = ref([])
  const scanLogs = ref([])

  // ตรวจสอบว่า URL รูปภาพโหลดได้หรือไม่
  const validateImageUrl = async (url, timeout = 5000) => {
    if (!url || url.trim() === '') return { valid: false, error: 'URL ว่างเปล่า' }
    
    // Local paths ถือว่า valid เสมอ
    if (url.startsWith('/') || url.startsWith('./')) {
      return { valid: true }
    }

    // Supabase Storage URLs ถือว่า valid (เพราะเราควบคุมได้)
    if (url.includes('supabase.co/storage')) {
      return { valid: true }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // ใช้ no-cors เพื่อหลีกเลี่ยง CORS issues
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // no-cors mode จะได้ opaque response เสมอ ต้องใช้วิธีอื่น
      // ลองโหลดรูปจริงๆ แทน
      return await validateByLoading(url, timeout)
    } catch (err) {
      if (err.name === 'AbortError') {
        return { valid: false, error: 'หมดเวลาในการโหลด' }
      }
      // ถ้า fetch ไม่ได้ ลองโหลดรูปจริง
      return await validateByLoading(url, timeout)
    }
  }

  // ตรวจสอบโดยการโหลดรูปจริง
  const validateByLoading = (url, timeout = 5000) => {
    return new Promise((resolve) => {
      const img = new Image()
      const timeoutId = setTimeout(() => {
        img.src = ''
        resolve({ valid: false, error: 'หมดเวลาในการโหลด' })
      }, timeout)

      img.onload = () => {
        clearTimeout(timeoutId)
        resolve({ valid: true, width: img.naturalWidth, height: img.naturalHeight })
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        resolve({ valid: false, error: 'ไม่สามารถโหลดรูปภาพได้' })
      }

      img.src = url
    })
  }

  // ตรวจสอบหลาย URLs พร้อมกัน
  const validateMultipleUrls = async (urls) => {
    const results = []
    for (const url of urls) {
      const result = await validateImageUrl(url)
      results.push({ url, ...result })
    }
    return results
  }

  // สแกนหารูปภาพที่เสียทั้งหมดในระบบ
  const scanAllBrokenImages = async () => {
    validating.value = true
    brokenImages.value = []
    scanLogs.value = []
    
    try {
      scanLogs.value.push('🔍 กำลังดึงข้อมูลสินค้าทั้งหมด...')
      
      // ดึงสินค้าทั้งหมด
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, image, images')
        .order('name')

      if (error) throw error

      const allImages = []
      
      // รวบรวม URLs ทั้งหมด
      products.forEach(product => {
        if (product.image) {
          allImages.push({ productId: product.id, productName: product.name, url: product.image, field: 'image' })
        }
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img, idx) => {
            if (img && img !== product.image) {
              allImages.push({ productId: product.id, productName: product.name, url: img, field: `images[${idx}]` })
            }
          })
        }
      })

      scanProgress.value = { current: 0, total: allImages.length, percent: 0 }
      scanLogs.value.push(`📦 พบ ${allImages.length} รูปภาพที่ต้องตรวจสอบ`)

      // ตรวจสอบทีละรูป
      for (let i = 0; i < allImages.length; i++) {
        const item = allImages[i]
        scanProgress.value.current = i + 1
        scanProgress.value.percent = Math.round(((i + 1) / allImages.length) * 100)

        const result = await validateImageUrl(item.url)
        
        if (!result.valid) {
          brokenImages.value.push({
            ...item,
            error: result.error
          })
          scanLogs.value.push(`❌ ${item.productName}: ${result.error}`)
        } else {
          scanLogs.value.push(`✅ ${item.productName}: OK`)
        }

        // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ request เยอะเกินไป
        await new Promise(r => setTimeout(r, 100))
      }

      scanLogs.value.push(`\n📊 สรุป: พบ ${brokenImages.value.length} รูปที่เสีย จาก ${allImages.length} รูปทั้งหมด`)
      
      return brokenImages.value
    } catch (err) {
      scanLogs.value.push(`❌ เกิดข้อผิดพลาด: ${err.message}`)
      throw err
    } finally {
      validating.value = false
    }
  }

  // แก้ไขรูปที่เสียเป็น placeholder
  const fixBrokenImage = async (productId, field) => {
    try {
      if (field === 'image') {
        await supabase
          .from('products')
          .update({ image: '/placeholder-product.svg' })
          .eq('id', productId)
      } else {
        // สำหรับ images array ต้องดึงมาแก้ไขแล้ว update กลับ
        const { data: product } = await supabase
          .from('products')
          .select('images')
          .eq('id', productId)
          .single()

        if (product?.images) {
          const match = field.match(/images\[(\d+)\]/)
          if (match) {
            const idx = parseInt(match[1])
            product.images[idx] = '/placeholder-product.svg'
            await supabase
              .from('products')
              .update({ images: product.images })
              .eq('id', productId)
          }
        }
      }
      return true
    } catch (err) {
      console.error('Error fixing broken image:', err)
      return false
    }
  }

  // แก้ไขรูปที่เสียทั้งหมด
  const fixAllBrokenImages = async () => {
    const results = { success: 0, failed: 0 }
    
    for (const item of brokenImages.value) {
      const success = await fixBrokenImage(item.productId, item.field)
      if (success) {
        results.success++
        scanLogs.value.push(`✅ แก้ไข ${item.productName} สำเร็จ`)
      } else {
        results.failed++
        scanLogs.value.push(`❌ แก้ไข ${item.productName} ล้มเหลว`)
      }
    }

    // Clear broken images list after fixing
    if (results.success > 0) {
      brokenImages.value = brokenImages.value.filter((_, i) => i >= results.success)
    }

    return results
  }

  return {
    validating,
    scanProgress,
    brokenImages,
    scanLogs,
    validateImageUrl,
    validateByLoading,
    validateMultipleUrls,
    scanAllBrokenImages,
    fixBrokenImage,
    fixAllBrokenImages
  }
}
