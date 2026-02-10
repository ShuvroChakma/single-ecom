/**
 * Cart API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface CartItem {
  id: string
  variant_id: string
  quantity: number
  product_name: string
  product_slug: string
  product_image: string | null
  variant_sku: string
  variant_info: string
  unit_price: number
  subtotal: number
  metal_type: string
  metal_purity: string
  size: string | null
  gross_weight: number
  net_weight: number
}

export interface Cart {
  id: string
  customer_id: string | null
  session_id: string | null
  items: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  promo_code: string | null
  created_at: string
  updated_at: string
}

export interface AddToCartRequest {
  variant_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

/**
 * Get current cart
 */
export async function getCart(): Promise<APIResponse<Cart>> {
  return apiClient.get<Cart>('/cart')
}

/**
 * Add item to cart
 */
export async function addToCart(data: AddToCartRequest): Promise<APIResponse<Cart>> {
  return apiClient.post<Cart>('/cart/items', data)
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<APIResponse<Cart>> {
  return apiClient.put<Cart>(`/cart/items/${itemId}`, data)
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<APIResponse<Cart>> {
  return apiClient.delete<Cart>(`/cart/items/${itemId}`)
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<APIResponse<{ success: boolean }>> {
  return apiClient.delete<{ success: boolean }>('/cart')
}

/**
 * Apply promo code to cart
 */
export async function applyPromoCode(code: string): Promise<APIResponse<Cart>> {
  return apiClient.post<Cart>('/cart/promo', { code })
}

/**
 * Remove promo code from cart
 */
export async function removePromoCode(): Promise<APIResponse<Cart>> {
  return apiClient.delete<Cart>('/cart/promo')
}
