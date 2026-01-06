import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Storage Analytics - ดูสถิติการใช้ storage และ bandwidth
 */
export function useStorageAnalytics() {
  const loading = ref(false)
  const storageStats = ref(null)
  const fileList = ref([])
  const error = ref(null)

  /**
   * ดึงรายการไฟล์ทั้งหมดใน bucket
   */
  const fetchFiles = async (bucket = 'products') => {
    loading.value = true
    error.value = null

    try {
      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { 
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) throw listError

      // Filter out folders and get file details
      fileList.value = data.filter(item => item.id).map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        created: file.created_at,
        lastAccessed: file.last_accessed_at
      }))

      // Calculate stats
      calculateStats()

      return fileList.value
    } catch (err) {
      error.value = err.message
      console.error('Storage analytics error:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * คำนวณสถิติ
   */
  const calculateStats = () => {
    const files = fileList.value

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)
    const imageCount = files.filter(f => f.type?.startsWith('image/')).length
    const webpCount = files.filter(f => f.type === 'image/webp').length

    // Group by type
    const byType = files.reduce((acc, f) => {
      const type = f.type || 'unknown'
      if (!acc[type]) acc[type] = { count: 0, size: 0 }
      acc[type].count++
      acc[type].size += f.size || 0
      return acc
    }, {})

    // Group by date (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentFiles = files.filter(f => new Date(f.created) > thirtyDaysAgo)
    const recentSize = recentFiles.reduce((sum, f) => sum + (f.size || 0), 0)

    // Top 10 largest files
    const topLargest = [...files]
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 10)

    storageStats.value = {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      imageCount,
      webpCount,
      webpPercent: imageCount > 0 ? Math.round((webpCount / imageCount) * 100) : 0,
      byType,
      recentFiles: recentFiles.length,
      recentSizeMB: (recentSize / (1024 * 1024)).toFixed(2),
      topLargest,
      // Supabase Free tier = 1GB
      usagePercent: Math.round((totalSize / (1024 * 1024 * 1024)) * 100),
      remainingMB: ((1024 * 1024 * 1024 - totalSize) / (1024 * 1024)).toFixed(2)
    }
  }

  /**
   * ลบไฟล์ที่ไม่ได้ใช้ (orphaned files)
   */
  const findOrphanedFiles = async (bucket = 'products') => {
    // ดึงรูปภาพที่ใช้ใน products
    const { data: products } = await supabase
      .from('products')
      .select('image, images')

    const usedUrls = new Set()
    products?.forEach(p => {
      if (p.image) usedUrls.add(extractFilename(p.image))
      p.images?.forEach(img => usedUrls.add(extractFilename(img)))
    })

    // หาไฟล์ที่ไม่ได้ใช้
    const orphaned = fileList.value.filter(f => !usedUrls.has(f.name))
    
    return orphaned
  }

  /**
   * Extract filename จาก URL
   */
  const extractFilename = (url) => {
    if (!url) return null
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : url.split('/').pop()
  }

  /**
   * ลบไฟล์
   */
  const deleteFile = async (filename, bucket = 'products') => {
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([filename])

    if (deleteError) throw deleteError
    
    // Refresh list
    await fetchFiles(bucket)
    return true
  }

  /**
   * ลบหลายไฟล์
   */
  const deleteFiles = async (filenames, bucket = 'products') => {
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filenames)

    if (deleteError) throw deleteError
    
    await fetchFiles(bucket)
    return true
  }

  /**
   * Format file size
   */
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    loading,
    storageStats,
    fileList,
    error,
    fetchFiles,
    findOrphanedFiles,
    deleteFile,
    deleteFiles,
    formatSize
  }
}
