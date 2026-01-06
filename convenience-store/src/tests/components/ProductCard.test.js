/**
 * ProductCard Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProductCard from '../../components/ProductCard.vue'

describe('ProductCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 100,
    image: 'test.jpg',
    is_active: true
  }

  it('should render product information', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    expect(wrapper.text()).toContain('Test Product')
    expect(wrapper.text()).toContain('100')
  })

  it('should show discount badge when original price exists', () => {
    const productWithDiscount = {
      ...mockProduct,
      original_price: 150
    }

    const wrapper = mount(ProductCard, {
      props: { product: productWithDiscount }
    })

    expect(wrapper.text()).toContain('-33%')
    expect(wrapper.text()).toContain('150')
  })

  it('should show add button when product not in cart', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    const addButton = wrapper.find('button[aria-label="เพิ่มลงตะกร้า"]')
    expect(addButton.exists()).toBe(true)
  })

  it('should have proper accessibility attributes', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    const article = wrapper.find('article')
    expect(article.attributes('aria-label')).toContain('Test Product')
    expect(article.attributes('aria-label')).toContain('100')
  })

  it('should show wishlist button when enabled', () => {
    const wrapper = mount(ProductCard, {
      props: { 
        product: mockProduct,
        enableWishlist: true
      }
    })

    const wishlistButton = wrapper.find('button[aria-pressed]')
    expect(wishlistButton.exists()).toBe(true)
  })
})
