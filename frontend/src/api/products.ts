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

export interface PriceBreakdown {
  rate_per_gram: number
  metal_cost: number
  making_charge_type: string
  making_charge_value: number
  making_charge: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_price: number
}

export interface ProductPricing {
  product_id: string
  name: string
  variants: Array<{ variant_id: string; sku: string; pricing: PriceBreakdown }>
}

export const getProductPricing = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { productId: string } }) =>
    apiRequest<ApiResponse<ProductPricing>>(`/products/products/${data.productId}/pricing`)
  )

export interface ProductAttributeValue {
  id: string
  attribute_id: string
  value: string
  attribute: {
    code: string
    name: string
    group_id: string
    type: string
  } | null
}

export const getProductAttributes = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { productId: string } }) =>
    apiRequest<ApiResponse<ProductAttributeValue[]>>(`/products/products/${data.productId}/attributes`)
  )

export interface AttributeGroup {
  id: string
  name: string
  sort_order: number
  attributes: { id: string; code: string; name: string; type: string }[]
}

export const getAttributeGroups = createServerFn({ method: 'GET' })
  .handler(async () =>
    apiRequest<ApiResponse<AttributeGroup[]>>(`/products/attribute-groups`)
  )

export interface Metal {
  id: string
  name: string
  code: string
  purities?: { id: string; label: string; value: string }[]
}

export const getMetals = createServerFn({ method: 'GET' })
  .handler(async () =>
    apiRequest<ApiResponse<Metal[]>>(`/products/metals`)
  )

export interface FilterableAttribute {
  id: string
  code: string
  name: string
  type: string
  options: string[] | null
  group_id: string
}

export const getFilterableAttributes = createServerFn({ method: 'GET' })
  .handler(async () =>
    apiRequest<ApiResponse<FilterableAttribute[]>>(`/products/attributes/filterable`)
  )

export const searchProducts = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { query: string; limit?: number } }) => {
    const { query, limit = 20 } = data
    return apiRequest<ApiResponse<ProductListResponse>>(`/products?search=${encodeURIComponent(query)}&per_page=${limit}`)
  })
