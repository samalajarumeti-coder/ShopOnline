import { ref, readonly } from 'vue'

// Default store settings
const DEFAULT_SETTINGS = {
  name: '7-Eleven Convenience Store',
  nameTh: 'เซเว่น อีเลฟเว่น',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  email: 'support@7-eleven-store.com',
  taxId: '0-1234-56789-01-2',
  website: '',
  lineId: '',
  facebookUrl: '',
  logoUrl: '',
  // Invoice settings
  invoicePrefix: 'INV',
  showLogo: true,
  showTaxId: true,
  showWebsite: false,
  showSocial: false,
  footerMessage: 'ขอบคุณที่ใช้บริการ | Thank you for your purchase',
  footerNote: '',
  // Receipt paper size
  paperSize: 'a4', // 'a4', 'a5', 'thermal'
}

const STORAGE_KEY = 'store_settings'

// Shared state
const settings = ref({ ...DEFAULT_SETTINGS })
const isLoaded = ref(false)

export function useStoreSettings() {
  // Load settings from localStorage
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      }
      isLoaded.value = true
    } catch (e) {
      console.warn('Failed to load store settings:', e)
      settings.value = { ...DEFAULT_SETTINGS }
    }
  }

  // Save settings to localStorage
  function saveSettings(newSettings) {
    try {
      settings.value = { ...settings.value, ...newSettings }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
      return true
    } catch (e) {
      console.error('Failed to save store settings:', e)
      return false
    }
  }

  // Reset to defaults
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    localStorage.removeItem(STORAGE_KEY)
  }

  // Export settings as JSON
  function exportSettings() {
    const dataStr = JSON.stringify(settings.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `store-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Import settings from JSON
  function importSettings(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          saveSettings(imported)
          resolve(true)
        } catch (err) {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Initialize on first use
  if (!isLoaded.value) {
    loadSettings()
  }

  return {
    settings: readonly(settings),
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    DEFAULT_SETTINGS
  }
}
