// Version-based cache management
const VERSION = '2.0.0'
const CACHE_NAME = `saduaksue-v${VERSION}`
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
]

// Install - cache static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${VERSION}`)
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Force immediate activation
  self.skipWaiting()
})

// Activate - clean old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${VERSION}`)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Delete old caches
        ...cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`)
            return caches.delete(name)
          }),
        // Notify all clients about the update
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: VERSION,
              message: 'New version available! Please refresh.'
            })
          })
        })
      ])
    })
  )
  self.clients.claim()
})

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls (Supabase)
  if (request.url.includes('supabase.co')) return

  // Skip external APIs (geocoding, etc.)
  if (request.url.includes('nominatim.openstreetmap.org')) return
  if (request.url.includes('api.bigdatacloud.net')) return

  // Skip admin routes from caching
  if (request.url.includes('/admin')) {
    event.respondWith(fetch(request))
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }
})

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'แจ้งเตือนจากร้าน'
  const options = {
    body: data.body || 'มีข้อความใหม่สำหรับคุณ',
    icon: data.icon || '/vite.svg',
    badge: '/vite.svg',
    data: {
      url: data.url || '/',
      productId: data.productId,
      type: data.type
    },
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
