import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Generate version from timestamp
const version = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(2, 12)

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  }
})
