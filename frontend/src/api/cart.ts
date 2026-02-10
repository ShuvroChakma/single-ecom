/**
 * Cart API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

// Cart Item from backend
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

export interface UpdateCartItemRequest {
  quantity: number
}

// Promo validation
export interface PromoValidationResult {
  valid: boolean
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  message: string
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
export async function addToCart(data: AddToCartRequest): Promise<APIResponse<CartItemAddedResponse>> {
  return apiClient.post<CartItemAddedResponse>('/cart/items', data)
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(itemId: string, quantity: number): Promise<APIResponse<CartItem>> {
  return apiClient.put<CartItem>(`/cart/items/${itemId}`, { quantity })
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<APIResponse<{ removed: boolean }>> {
  return apiClient.delete<{ removed: boolean }>(`/cart/items/${itemId}`)
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<APIResponse<{ cleared: boolean }>> {
  return apiClient.delete<{ cleared: boolean }>('/cart')
}

/**
 * Validate promo code (does not apply, just validates)
 */
export async function validatePromoCode(code: string, orderAmount: number): Promise<APIResponse<PromoValidationResult>> {
  return apiClient.post<PromoValidationResult>('/promo/validate', { code, order_amount: orderAmount })
}
