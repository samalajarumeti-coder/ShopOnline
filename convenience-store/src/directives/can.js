import { usePermissions } from '../composables/usePermissions'

/**
 * v-can directive for permission-based rendering
 * 
 * Usage:
 * <button v-can:delete="'products'">ลบ</button>
 * <button v-can:edit="'orders'">แก้ไข</button>
 * <div v-can:view="'users'">...</div>
 * 
 * The element will be hidden if user doesn't have permission
 */
export const vCan = {
  mounted(el, binding) {
    const { can } = usePermissions()
    const action = binding.arg // delete, edit, view, create
    const resource = binding.value // products, orders, users, etc.
    
    if (!action || !resource) {
      console.warn('v-can directive requires both action and resource')
      return
    }
    
    const hasPermission = can(resource, action)
    
    if (!hasPermission) {
      // Hide element by removing it from DOM
      el.style.display = 'none'
      // Store original display value for potential restoration
      el.dataset.originalDisplay = el.style.display
    }
  },
  
  updated(el, binding) {
    const { can } = usePermissions()
    const action = binding.arg
    const resource = binding.value
    
    if (!action || !resource) return
    
    const hasPermission = can(resource, action)
    
    if (hasPermission) {
      // Restore element
      el.style.display = el.dataset.originalDisplay || ''
    } else {
      // Hide element
      el.style.display = 'none'
    }
  }
}
