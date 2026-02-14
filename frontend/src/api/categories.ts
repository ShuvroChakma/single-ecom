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
  // Category filters
  category_id?: string
  category_ids?: string[]  // Multiple categories
  // Brand filters
  brand_id?: string
  brand_ids?: string[]  // Multiple brands
  // Collection filters
  collection_id?: string
  collection_ids?: string[]  // Multiple collections
  // Gender filters
  gender?: string
  genders?: string[]  // Multiple genders
  // Metal filters
  metal_type?: string
  metal_types?: string[]  // Multiple metal types
  metal_purity?: string
  metal_purities?: string[]  // Multiple purities
  // Size filter
  size?: string
  sizes?: string[]  // Multiple sizes
  // Weight range
  min_weight?: number
  max_weight?: number
  // Stock filter
  in_stock?: boolean
  // Status
  is_featured?: boolean
  // Search
  search?: string
  // Sorting
  sort_by?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'featured'
  // Pagination
  page?: number
  per_page?: number
  // IDs
  ids?: string[]
  exclude_ids?: string[]
}

/**
 * Get category tree (public endpoint)
 */
export async function getCategoryTree(): Promise<APIResponse<Category[]>> {
  return apiClient.get<Category[]>('/catalog/categories/tree')
}

/**
 * Get products with advanced filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<APIResponse<ProductListResponse>> {
  const params = new URLSearchParams()

  // Single value filters
  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.brand_id) params.append('brand_id', filters.brand_id)
  if (filters.collection_id) params.append('collection_id', filters.collection_id)
  if (filters.gender) params.append('gender', filters.gender)
  if (filters.metal_type) params.append('metal_type', filters.metal_type)
  if (filters.metal_purity) params.append('metal_purity', filters.metal_purity)
  if (filters.size) params.append('size', filters.size)

  // Array filters (comma-separated)
  if (filters.category_ids?.length) params.append('category_ids', filters.category_ids.join(','))
  if (filters.brand_ids?.length) params.append('brand_ids', filters.brand_ids.join(','))
  if (filters.collection_ids?.length) params.append('collection_ids', filters.collection_ids.join(','))
  if (filters.genders?.length) params.append('genders', filters.genders.join(','))
  if (filters.metal_types?.length) params.append('metal_types', filters.metal_types.join(','))
  if (filters.metal_purities?.length) params.append('metal_purities', filters.metal_purities.join(','))
  if (filters.sizes?.length) params.append('sizes', filters.sizes.join(','))
  if (filters.ids?.length) params.append('ids', filters.ids.join(','))
  if (filters.exclude_ids?.length) params.append('exclude_ids', filters.exclude_ids.join(','))

  // Range filters
  if (filters.min_weight !== undefined) params.append('min_weight', String(filters.min_weight))
  if (filters.max_weight !== undefined) params.append('max_weight', String(filters.max_weight))

  // Boolean filters
  if (filters.in_stock !== undefined) params.append('in_stock', String(filters.in_stock))
  if (filters.is_featured !== undefined) params.append('is_featured', String(filters.is_featured))

  // Search and sorting
  if (filters.search) params.append('search', filters.search)
  if (filters.sort_by) params.append('sort_by', filters.sort_by)

  // Pagination
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
