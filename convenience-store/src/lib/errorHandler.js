/**
 * Standard Error Handler Utility
 * Provides consistent error handling across the application
 */

/**
 * Handle Supabase errors with consistent logging and user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'fetchProducts', 'createOrder')
 * @param {boolean} [throwError=true] - Whether to throw the error after logging
 * @returns {import('./types/jsdoc').ErrorInfo} - Formatted error object
 * @throws {Error} - Throws user-friendly error if throwError is true
 */
export function handleSupabaseError(error, context, throwError = true) {
  const errorInfo = {
    context,
    message: error.message || 'Unknown error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || null,
    hint: error.hint || null,
    timestamp: new Date().toISOString()
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[${context}] Supabase Error:`, errorInfo)
  }

  // In production, you might want to send to error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo })

  if (throwError) {
    throw new Error(getUserFriendlyMessage(error, context))
  }

  return errorInfo
}

/**
 * Get user-friendly error message based on error type
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @returns {string} - User-friendly error message in Thai
 */
export function getUserFriendlyMessage(error, context) {
  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
  }

  // Authentication errors
  if (error.message?.includes('Invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  }

  if (error.message?.includes('Email not confirmed')) {
    return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
  }

  if (error.message?.includes('User already registered')) {
    return 'อีเมลนี้ถูกใช้งานแล้ว'
  }

  // Permission errors
  if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
    return 'คุณไม่มีสิทธิ์ในการดำเนินการนี้'
  }

  // Not found errors
  if (error.code === 'PGRST116') {
    return 'ไม่พบข้อมูลที่ต้องการ'
  }

  // Validation errors
  if (error.message?.includes('violates check constraint')) {
    return 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
  }

  if (error.message?.includes('duplicate key value')) {
    return 'ข้อมูลนี้มีอยู่ในระบบแล้ว'
  }

  // Default message with context
  return `เกิดข้อผิดพลาดในการ${getContextMessage(context)} กรุณาลองใหม่อีกครั้ง`
}

/**
 * Get Thai context message
 * @param {string} context - Context identifier
 * @returns {string} - Thai context message
 */
function getContextMessage(context) {
  const contextMap = {
    fetchProducts: 'โหลดสินค้า',
    fetchOrders: 'โหลดคำสั่งซื้อ',
    createOrder: 'สร้างคำสั่งซื้อ',
    updateOrder: 'อัพเดทคำสั่งซื้อ',
    deleteOrder: 'ลบคำสั่งซื้อ',
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    updateProfile: 'อัพเดทโปรไฟล์',
    fetchProfile: 'โหลดโปรไฟล์',
    addAddress: 'เพิ่มที่อยู่',
    updateAddress: 'อัพเดทที่อยู่',
    deleteAddress: 'ลบที่อยู่',
    claimCoupon: 'รับคูปอง',
    useCoupon: 'ใช้คูปอง'
  }

  return contextMap[context] || 'ดำเนินการ'
}

/**
 * Async wrapper with error handling
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context identifier
 * @returns {Promise<any>} - Result or throws error
 * @throws {Error} - Throws user-friendly error
 */
export async function withErrorHandling(fn, context) {
  try {
    return await fn()
  } catch (error) {
    return handleSupabaseError(error, context, true)
  }
}

/**
 * Safe async wrapper that returns [error, data] tuple
 * @template T
 * @param {Promise<T>} promise - Promise to execute
 * @returns {Promise<[Error, null] | [null, T]>} - [error, data] tuple
 * @example
 * const [error, data] = await safeAsync(fetchProducts())
 * if (error) {
 *   console.error(error)
 *   return
 * }
 * console.log(data)
 */
export async function safeAsync(promise) {
  try {
    const data = await promise
    return [null, data]
  } catch (error) {
    return [error, null]
  }
}
