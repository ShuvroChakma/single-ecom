/**
 * Wishlist API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'
import type { Product } from './categories'

export interface WishlistItem {
  id: string
  product_id: string
  variant_id: string | null
  product: Product
  added_at: string
}

export interface Wishlist {
  items: WishlistItem[]
  total: number
}

/**
 * Get user's wishlist
 */
export async function getWishlist(): Promise<APIResponse<Wishlist>> {
  return apiClient.get<Wishlist>('/wishlist')
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string, variantId?: string): Promise<APIResponse<WishlistItem>> {
  return apiClient.post<WishlistItem>('/wishlist', { product_id: productId, variant_id: variantId })
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(itemId: string): Promise<APIResponse<{ success: boolean }>> {
  return apiClient.delete<{ success: boolean }>(`/wishlist/${itemId}`)
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(productId: string): Promise<APIResponse<{ in_wishlist: boolean; item_id: string | null }>> {
  return apiClient.get<{ in_wishlist: boolean; item_id: string | null }>(`/wishlist/check/${productId}`)
}

/**
 * Clear entire wishlist
 */
export async function clearWishlist(): Promise<APIResponse<{ success: boolean }>> {
  return apiClient.delete<{ success: boolean }>('/wishlist')
}

/**
 * Move wishlist item to cart
 */
export async function moveToCart(itemId: string): Promise<APIResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>(`/wishlist/${itemId}/move-to-cart`, {})
}
