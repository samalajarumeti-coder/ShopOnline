import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function usePermissions() {
  const authStore = useAuthStore()

  const userRole = computed(() => authStore.user?.role || 'customer')

  const permissions = computed(() => ({
    // Admin: Full access
    isAdmin: userRole.value === 'admin',
    
    // Manager: Create, Read, Update (no Delete)
    isManager: userRole.value === 'manager',
    isManagerOrAbove: ['admin', 'manager'].includes(userRole.value),
    
    // Staff: Read only
    isStaff: userRole.value === 'staff',
    isStaffOrAbove: ['admin', 'manager', 'staff'].includes(userRole.value),
    
    // Specific permissions
    canCreate: ['admin', 'manager'].includes(userRole.value),
    canUpdate: ['admin', 'manager'].includes(userRole.value),
    canDelete: userRole.value === 'admin',
    canViewAll: ['admin', 'manager', 'staff'].includes(userRole.value),
    canManageRoles: userRole.value === 'admin',
  }))

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: '👑' },
      manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700', icon: '💼' },
      staff: { label: 'Staff', color: 'bg-blue-100 text-blue-700', icon: '👤' },
      customer: { label: 'Customer', color: 'bg-gray-100 text-gray-700', icon: '🛒' },
    }
    return badges[role] || badges.customer
  }

  const getPermissionMessage = (action) => {
    const messages = {
      create: {
        allowed: 'คุณสามารถสร้างรายการใหม่ได้',
        denied: 'เฉพาะ Admin และ Manager เท่านั้นที่สามารถสร้างรายการใหม่ได้',
      },
      update: {
        allowed: 'คุณสามารถแก้ไขรายการได้',
        denied: 'เฉพาะ Admin และ Manager เท่านั้นที่สามารถแก้ไขรายการได้',
      },
      delete: {
        allowed: 'คุณสามารถลบรายการได้',
        denied: 'เฉพาะ Admin เท่านั้นที่สามารถลบรายการได้',
      },
    }
    
    const canPerform = {
      create: permissions.value.canCreate,
      update: permissions.value.canUpdate,
      delete: permissions.value.canDelete,
    }
    
    return canPerform[action] 
      ? messages[action].allowed 
      : messages[action].denied
  }

  const handleUnauthorizedAction = (action) => {
    const message = getPermissionMessage(action)
    return {
      success: false,
      error: message,
      needsUpgrade: !permissions.value.isManagerOrAbove,
    }
  }

  return {
    userRole,
    permissions,
    getRoleBadge,
    getPermissionMessage,
    handleUnauthorizedAction,
  }
}
