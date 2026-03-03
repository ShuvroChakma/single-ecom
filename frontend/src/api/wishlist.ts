/**
 * Wishlist API - Server Functions (token from HttpOnly cookie)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { apiRequest, ApiResponse } from './client'

export interface WishlistProductInfo {
  id: string
  name: string
  slug: string
  image: string | null
}

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

export const getWishlist = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Wishlist>>('/wishlist', {}, token)
  })

export const addToWishlist = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { product_id: string; variant_id?: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<WishlistItem>>('/wishlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  })

export const removeFromWishlist = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { itemId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ removed: boolean }>>(`/wishlist/${data.itemId}`, {
      method: 'DELETE',
    }, token)
  })

export const checkWishlist = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { productId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: { in_wishlist: false, item_id: null } } as any
    return apiRequest<ApiResponse<WishlistCheckResponse>>(`/wishlist/check/${data.productId}`, {}, token)
  })

export const clearWishlist = createServerFn({ method: 'POST' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ cleared: boolean }>>('/wishlist', {
      method: 'DELETE',
    }, token)
  })

export const moveToCart = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { itemId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ success: boolean }>>(`/wishlist/${data.itemId}/move-to-cart`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, token)
  })
