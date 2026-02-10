/**
 * Wishlist API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

// Product info in wishlist
export interface WishlistProductInfo {
  id: string
  name: string
  slug: string
  image: string | null
}

// Variant info in wishlist
export interface WishlistVariantInfo {
  id: string
  sku: string
  metal_type: string
  metal_purity: string
  metal_color: string
  size: string | null
  calculated_price: number | null
}

export interface WishlistItem {
  id: string
  product: WishlistProductInfo
  variant: WishlistVariantInfo | null
  added_at: string
}

export interface Wishlist {
  items: WishlistItem[]
  total: number
}

export interface WishlistCheckResponse {
  in_wishlist: boolean
  item_id: string | null
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
export async function removeFromWishlist(itemId: string): Promise<APIResponse<{ removed: boolean }>> {
  return apiClient.delete<{ removed: boolean }>(`/wishlist/${itemId}`)
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(productId: string): Promise<APIResponse<WishlistCheckResponse>> {
  return apiClient.get<WishlistCheckResponse>(`/wishlist/check/${productId}`)
}

/**
 * Clear entire wishlist
 */
export async function clearWishlist(): Promise<APIResponse<{ cleared: boolean }>> {
  return apiClient.delete<{ cleared: boolean }>('/wishlist')
}

/**
 * Move wishlist item to cart
 */
export async function moveToCart(itemId: string): Promise<APIResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>(`/wishlist/${itemId}/move-to-cart`, {})
}
