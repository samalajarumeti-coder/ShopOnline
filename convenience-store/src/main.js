import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// Import custom directives
import { vCan } from './directives/can'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Register custom directives
app.directive('can', vCan)

// Initialize auth store
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
