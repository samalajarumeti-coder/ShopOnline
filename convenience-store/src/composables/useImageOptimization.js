import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Image Optimization Pipeline
 * Auto-resize และ compress รูปภาพเป็น 3 ขนาด: thumbnail, medium, large
 */

// ขนาดรูปภาพ
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 0.7 },
  medium: { width: 400, height: 400, quality: 0.8 },
  large: { width: 800, height: 800, quality: 0.85 }
}

export function useImageOptimization() {
  const processing = ref(false)
  const progress = ref({ current: 0, total: 0 })

  /**
   * Resize และ compress รูปภาพ
   */
  const resizeImage = (file, maxWidth, maxHeight, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          // คำนวณขนาดใหม่โดยรักษา aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          // ใช้ smoothing สำหรับคุณภาพที่ดีขึ้น
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => resolve(blob),
            'image/webp', // ใช้ WebP เพื่อขนาดไฟล์เล็กลง
            quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * สร้างชื่อไฟล์สำหรับแต่ละขนาด
   */
  const generateFilename = (originalName, size) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `${timestamp}-${random}-${size}.webp`
  }

  /**
   * Upload รูปภาพไปยัง Supabase Storage
   */
  const uploadToStorage = async (blob, filename, bucket = 'products') => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, blob, {
        cacheControl: '31536000', // Cache 1 ปี
        contentType: 'image/webp',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename)

    return publicUrl
  }

  /**
   * Process รูปภาพเดียวเป็น 3 ขนาด
   * @returns { thumbnail, medium, large, original }
   */
  const processImage = async (file, bucket = 'products') => {
    processing.value = true
    progress.value = { current: 0, total: 4 }

    try {
      const results = {}
      const baseName = file.name.replace(/\.[^/.]+$/, '')

      // 1. Upload original (compressed)
      const originalBlob = await resizeImage(file, 1200, 1200, 0.9)
      results.original = await uploadToStorage(
        originalBlob,
        generateFilename(baseName, 'original'),
        bucket
      )
      progress.value.current = 1

      // 2. Create thumbnail
      const thumbBlob = await resizeImage(
        file,
        IMAGE_SIZES.thumbnail.width,
        IMAGE_SIZES.thumbnail.height,
        IMAGE_SIZES.thumbnail.quality
      )
      results.thumbnail = await uploadToStorage(
        thumbBlob,
        generateFilename(baseName, 'thumb'),
        bucket
      )
      progress.value.current = 2

      // 3. Create medium
      const mediumBlob = await resizeImage(
        file,
        IMAGE_SIZES.medium.width,
        IMAGE_SIZES.medium.height,
        IMAGE_SIZES.medium.quality
      )
      results.medium = await uploadToStorage(
        mediumBlob,
        generateFilename(baseName, 'medium'),
        bucket
      )
      progress.value.current = 3

      // 4. Create large
      const largeBlob = await resizeImage(
        file,
        IMAGE_SIZES.large.width,
        IMAGE_SIZES.large.height,
        IMAGE_SIZES.large.quality
      )
      results.large = await uploadToStorage(
        largeBlob,
        generateFilename(baseName, 'large'),
        bucket
      )
      progress.value.current = 4

      return results
    } finally {
      processing.value = false
    }
  }

  /**
   * Process หลายรูปพร้อมกัน
   */
  const processMultipleImages = async (files, bucket = 'products') => {
    const results = []
    progress.value = { current: 0, total: files.length }

    for (let i = 0; i < files.length; i++) {
      const result = await processImage(files[i], bucket)
      results.push(result)
      progress.value.current = i + 1
    }

    return results
  }

  /**
   * ดึง URL ที่เหมาะสมตามขนาดหน้าจอ
   */
  const getOptimalImageUrl = (imageSet, containerWidth = 400) => {
    if (!imageSet || typeof imageSet === 'string') return imageSet

    if (containerWidth <= 150) return imageSet.thumbnail || imageSet.medium || imageSet.original
    if (containerWidth <= 400) return imageSet.medium || imageSet.large || imageSet.original
    return imageSet.large || imageSet.original
  }

  /**
   * สร้าง srcset สำหรับ responsive images
   */
  const generateSrcSet = (imageSet) => {
    if (!imageSet || typeof imageSet === 'string') return ''

    const srcset = []
    if (imageSet.thumbnail) srcset.push(`${imageSet.thumbnail} 150w`)
    if (imageSet.medium) srcset.push(`${imageSet.medium} 400w`)
    if (imageSet.large) srcset.push(`${imageSet.large} 800w`)
    if (imageSet.original) srcset.push(`${imageSet.original} 1200w`)

    return srcset.join(', ')
  }

  return {
    processing,
    progress,
    processImage,
    processMultipleImages,
    getOptimalImageUrl,
    generateSrcSet,
    IMAGE_SIZES
  }
}
