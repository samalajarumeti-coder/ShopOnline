/**
 * Error Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSupabaseError, getUserFriendlyMessage, safeAsync } from '../../lib/errorHandler'

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserFriendlyMessage', () => {
    it('should return Thai message for network errors', () => {
      const error = new Error('Failed to fetch')
      const message = getUserFriendlyMessage(error, 'fetchProducts')
      expect(message).toContain('เชื่อมต่อ')
      expect(message).toContain('อินเทอร์เน็ต')
    })

    it('should return Thai message for invalid credentials', () => {
      const error = new Error('Invalid login credentials')
      const message = getUserFriendlyMessage(error, 'signIn')
      expect(message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    })

    it('should return Thai message for permission denied', () => {
      const error = { code: 'PGRST301', message: 'permission denied' }
      const message = getUserFriendlyMessage(error, 'updateProduct')
      expect(message).toContain('ไม่มีสิทธิ์')
    })

    it('should return Thai message for not found', () => {
      const error = { code: 'PGRST116', message: 'not found' }
      const message = getUserFriendlyMessage(error, 'fetchProduct')
      expect(message).toContain('ไม่พบข้อมูล')
    })

    it('should return context-specific message for unknown errors', () => {
      const error = new Error('Unknown error')
      const message = getUserFriendlyMessage(error, 'fetchProducts')
      expect(message).toContain('โหลดสินค้า')
    })
  })

  describe('handleSupabaseError', () => {
    it('should throw error with user-friendly message when throwError is true', () => {
      const error = new Error('Invalid login credentials')
      
      expect(() => {
        handleSupabaseError(error, 'signIn', true)
      }).toThrow('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    })

    it('should not throw error when throwError is false', () => {
      const error = new Error('Test error')
      
      expect(() => {
        handleSupabaseError(error, 'fetchProducts', false)
      }).not.toThrow()
    })

    it('should return error info object', () => {
      const error = new Error('Test error')
      const result = handleSupabaseError(error, 'fetchProducts', false)
      
      expect(result).toHaveProperty('context', 'fetchProducts')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('code')
      expect(result).toHaveProperty('timestamp')
    })
  })

  describe('safeAsync', () => {
    it('should return [null, data] on success', async () => {
      const promise = Promise.resolve({ id: 1, name: 'Test' })
      const [error, data] = await safeAsync(promise)
      
      expect(error).toBeNull()
      expect(data).toEqual({ id: 1, name: 'Test' })
    })

    it('should return [error, null] on failure', async () => {
      const promise = Promise.reject(new Error('Test error'))
      const [error, data] = await safeAsync(promise)
      
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(data).toBeNull()
    })
  })
})
