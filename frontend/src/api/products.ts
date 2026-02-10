/**
 * Products API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'
import type { Product, ProductListResponse, ProductFilters } from './categories'

// Re-export types from categories
export type { Product, ProductVariant, ProductListResponse, ProductFilters } from './categories'

/**
 * Get products with filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<APIResponse<ProductListResponse>> {
  const params = new URLSearchParams()

  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.brand_id) params.append('brand_id', filters.brand_id)
  if (filters.collection_id) params.append('collection_id', filters.collection_id)
  if (filters.gender) params.append('gender', filters.gender)
  if (filters.metal_type) params.append('metal_type', filters.metal_type)
  if (filters.is_featured !== undefined) params.append('is_featured', String(filters.is_featured))
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.per_page) params.append('per_page', String(filters.per_page))

  const queryString = params.toString()
  const url = queryString ? `/products?${queryString}` : '/products'

  return apiClient.get<ProductListResponse>(url)
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 8): Promise<APIResponse<ProductListResponse>> {
  return apiClient.get<ProductListResponse>(`/products?is_featured=true&per_page=${limit}`)
}

/**
 * Get new arrivals (sorted by created_at desc)
 */
export async function getNewArrivals(limit: number = 8): Promise<APIResponse<ProductListResponse>> {
  return apiClient.get<ProductListResponse>(`/products?per_page=${limit}`)
}

/**
 * Get products by gender
 */
export async function getProductsByGender(gender: string, limit: number = 4): Promise<APIResponse<ProductListResponse>> {
  return apiClient.get<ProductListResponse>(`/products?gender=${gender}&per_page=${limit}`)
}

/**
 * Get products by category slug
 */
export async function getProductsByCategory(categoryId: string, limit: number = 8): Promise<APIResponse<ProductListResponse>> {
  return apiClient.get<ProductListResponse>(`/products?category_id=${categoryId}&per_page=${limit}`)
}

/**
 * Get single product by slug
 */
export async function getProductBySlug(slug: string): Promise<APIResponse<Product>> {
  return apiClient.get<Product>(`/products/${slug}`)
}

/**
 * Search products
 */
export async function searchProducts(query: string, limit: number = 20): Promise<APIResponse<ProductListResponse>> {
  return apiClient.get<ProductListResponse>(`/products?search=${encodeURIComponent(query)}&per_page=${limit}`)
}
