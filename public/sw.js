const CACHE_NAME = 'warehouse-v1'
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_CACHE)
    })
  )
  self.skipWaiting()
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return

  // 跳过 Netlify Functions 和 API 请求
  if (event.request.url.includes('/.netlify/')) return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 缓存命中，直接返回
        return cachedResponse
      }

      // 缓存未命中，发起网络请求
      return fetch(event.request).then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // 克隆响应（响应流只能使用一次）
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// 处理推送通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')

  let data = {
    title: '仓库管理',
    body: '您有物品即将过期',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png'
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error)
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: '查看'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received')

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 查找已打开的窗口
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }

      // 没有已打开的窗口，打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

console.log('[SW] Service Worker loaded')
