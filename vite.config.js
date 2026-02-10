import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',  // 强制使用绝对路径，避免资源路径拼接错误
  plugins: [vue()],
})
