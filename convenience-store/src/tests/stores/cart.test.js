/**
 * Cart Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../../stores/cart'

describe('Cart Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with empty cart', () => {
    const store = useCartStore()
    expect(store.items).toEqual([])
    expect(store.totalItems).toBe(0)
    expect(store.totalPrice).toBe(0)
  })

  it('should add product to cart', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)

    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toMatchObject({
      id: 1,
      name: 'Test Product',
      price: 100,
      quantity: 1
    })
    expect(store.totalItems).toBe(1)
    expect(store.totalPrice).toBe(100)
  })

  it('should increase quantity when adding existing product', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)
    store.addToCart(product)

    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(2)
    expect(store.totalItems).toBe(2)
    expect(store.totalPrice).toBe(200)
  })

  it('should remove product from cart', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)
    store.removeFromCart(1)

    expect(store.items).toHaveLength(0)
    expect(store.totalItems).toBe(0)
    expect(store.totalPrice).toBe(0)
  })

  it('should update product quantity', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)
    store.updateQuantity(1, 5)

    expect(store.items[0].quantity).toBe(5)
    expect(store.totalItems).toBe(5)
    expect(store.totalPrice).toBe(500)
  })

  it('should remove product when quantity is 0', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)
    store.updateQuantity(1, 0)

    expect(store.items).toHaveLength(0)
  })

  it('should clear cart', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)
    store.clearCart()

    expect(store.items).toHaveLength(0)
    expect(store.totalItems).toBe(0)
    expect(store.totalPrice).toBe(0)
  })

  it('should calculate total price correctly with multiple products', () => {
    const store = useCartStore()
    
    store.addToCart({ id: 1, name: 'Product 1', price: 100, image: 'test1.jpg' })
    store.addToCart({ id: 2, name: 'Product 2', price: 200, image: 'test2.jpg' })
    store.addToCart({ id: 1, name: 'Product 1', price: 100, image: 'test1.jpg' })

    expect(store.totalItems).toBe(3)
    expect(store.totalPrice).toBe(400) // (100 * 2) + (200 * 1)
  })

  it('should persist cart to localStorage', () => {
    const store = useCartStore()
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg'
    }

    store.addToCart(product)

    expect(localStorage.setItem).toHaveBeenCalled()
  })
})
