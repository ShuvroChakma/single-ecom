/**
 * Cart API - Server Functions (token from HttpOnly cookie)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { apiRequest, ApiResponse } from './client'

export interface CartItemProduct {
  id: string
  name: string
  slug: string
  image: string | null
}

export interface CartItemVariant {
  id: string
  sku: string
  metal_type: string
  metal_purity: string
  metal_color: string
  size: string | null
  gross_weight: number
  net_weight: number
}

export interface CartItem {
  id: string
  product: CartItemProduct
  variant: CartItemVariant
  quantity: number
  price_when_added: number
  current_price: number
  price_changed: boolean
  line_total: number
  added_at: string
}

export interface Cart {
  items: CartItem[]
  item_count: number
  unique_items: number
  subtotal: number
  tax_amount: number
  total: number
  currency: string
}

export interface CartItemAddedResponse {
  item: CartItem
  cart_total: number
  item_count: number
}

export interface AddToCartRequest {
  variant_id: string
  quantity?: number
}

export interface PromoValidationResult {
  valid: boolean
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  message: string
}

export const getCart = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Cart>>('/cart', {}, token)
  })

export const addToCart = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ variant_id: z.string(), quantity: z.number().optional() }))
  .handler(async ({ data }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<CartItemAddedResponse>>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  })

export const updateCartItem = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ itemId: z.string(), quantity: z.number() }))
  .handler(async ({ data }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<CartItem>>(`/cart/items/${data.itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: data.quantity }),
    }, token)
  })

export const removeFromCart = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ itemId: z.string() }))
  .handler(async ({ data }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ removed: boolean }>>(`/cart/items/${data.itemId}`, {
      method: 'DELETE',
    }, token)
  })

export const clearCart = createServerFn({ method: 'POST' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ cleared: boolean }>>('/cart', {
      method: 'DELETE',
    }, token)
  })

export const validatePromoCode = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ code: z.string(), order_amount: z.number() }))
  .handler(async ({ data }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<PromoValidationResult>>('/promo/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  })
