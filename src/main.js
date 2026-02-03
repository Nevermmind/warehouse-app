import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope)

        // 监听 Service Worker 更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本可用
                console.log('[SW] New version available, please refresh the page')
                // 可以在这里添加"更新可用"的提示
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error)
      })
  })
}

createApp(App).use(router).mount('#app')
