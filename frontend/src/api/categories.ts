/**
 * Categories API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

// Types
export interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  icon: string | null
  banner: string | null
  parent_id: string | null
  level: number
  path: string
  created_at: string
  updated_at: string
  children: Category[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  sku_base: string
  category_id: string
  brand_id: string | null
  collection_id: string | null
  gender: string | null
  metal_type: string | null
  is_active: boolean
  is_featured: boolean
  images: string[]
  tags: string[]
  created_at: string
  updated_at: string
  variants: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  metal_type: string
  metal_purity: string
  size: string | null
  gross_weight: number
  net_weight: number
  stock_quantity: number
  is_default: boolean
  is_active: boolean
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface ProductFilters {
  category_id?: string
  brand_id?: string
  collection_id?: string
  gender?: string
  metal_type?: string
  is_featured?: boolean
  search?: string
  page?: number
  per_page?: number
}

/**
 * Get category tree (public endpoint)
 */
export async function getCategoryTree(): Promise<APIResponse<Category[]>> {
  return apiClient.get<Category[]>('/catalog/categories/tree')
}

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
 * Get single product by slug
 */
export async function getProductBySlug(slug: string): Promise<APIResponse<Product>> {
  return apiClient.get<Product>(`/products/${slug}`)
}

/**
 * Get single product by ID
 */
export async function getProductById(id: string): Promise<APIResponse<Product>> {
  return apiClient.get<Product>(`/products/id/${id}`)
}

/**
 * Find category by slug from category tree
 */
export function findCategoryBySlug(categories: Category[], slug: string): Category | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return category
    }
    if (category.children?.length > 0) {
      const found = findCategoryBySlug(category.children, slug)
      if (found) return found
    }
  }
  return null
}

/**
 * Get all subcategories of a category (flattened)
 */
export function getAllSubcategories(category: Category): Category[] {
  const subcategories: Category[] = []

  function collectChildren(cat: Category) {
    if (cat.children?.length > 0) {
      for (const child of cat.children) {
        subcategories.push(child)
        collectChildren(child)
      }
    }
  }

  collectChildren(category)
  return subcategories
}
