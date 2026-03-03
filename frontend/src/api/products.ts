/**
 * Products API - Server Functions (public, no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'
import type { Product, ProductListResponse } from './categories'

// Re-export types from categories
export type { Product, ProductVariant, ProductListResponse, ProductFilters } from './categories'

export const getFeaturedProducts = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { limit?: number } }) => {
    const limit = data?.limit ?? 8
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?is_featured=true&per_page=${limit}`)
  })

export const getNewArrivals = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { limit?: number } }) => {
    const limit = data?.limit ?? 8
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?per_page=${limit}`)
  })

export const getProductsByGender = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { gender: string; limit?: number } }) => {
    const { gender, limit = 4 } = data
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?gender=${gender}&per_page=${limit}`)
  })

export const getProductsByCategory = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { categoryId: string; limit?: number } }) => {
    const { categoryId, limit = 8 } = data
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?category_id=${categoryId}&per_page=${limit}`)
  })

export const getProductBySlug = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { slug: string } }) => {
    return apiRequest<ApiResponse<Product>>(`/products/${data.slug}`)
  })

export const searchProducts = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { query: string; limit?: number } }) => {
    const { query, limit = 20 } = data
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?search=${encodeURIComponent(query)}&per_page=${limit}`)
  })
