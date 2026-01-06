import { ref, onMounted } from 'vue'

export function useServiceWorker() {
  const updateAvailable = ref(false)
  const newVersion = ref('')
  const registration = ref(null)

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        registration.value = await navigator.serviceWorker.register('/sw.js')
        console.log('[SW] Registered successfully')

        // Listen for updates
        registration.value.addEventListener('updatefound', () => {
          const newWorker = registration.value.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available')
              updateAvailable.value = true
            }
          })
        })

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('[SW] Update message received:', event.data)
            updateAvailable.value = true
            newVersion.value = event.data.version
          }
        })
      } catch (error) {
        console.error('[SW] Registration failed:', error)
      }
    }
  }

  const updateServiceWorker = () => {
    if (registration.value && registration.value.waiting) {
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    } else {
      window.location.reload()
    }
  }

  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success)
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      })
    }
  }

  onMounted(() => {
    registerServiceWorker()
  })

  return {
    updateAvailable,
    newVersion,
    updateServiceWorker,
    clearCache
  }
}
