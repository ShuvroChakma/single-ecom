/**
 * Stores API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface Store {
  id: string
  name: string
  address: string
  city: string
  state: string | null
  country: string
  postal_code: string | null
  phone: string | null
  email: string | null
  hours: string | null
  latitude: number
  longitude: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreListResponse {
  items: Store[]
  total: number
}

/**
 * Get all stores
 */
export async function getStores(): Promise<APIResponse<Store[]>> {
  return apiClient.get<Store[]>('/stores')
}

/**
 * Get store by ID
 */
export async function getStore(storeId: string): Promise<APIResponse<Store>> {
  return apiClient.get<Store>(`/stores/${storeId}`)
}

/**
 * Find nearby stores
 */
export async function findNearbyStores(lat: number, lng: number, radiusKm: number = 50): Promise<APIResponse<Store[]>> {
  return apiClient.get<Store[]>(`/stores/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`)
}

/**
 * Search stores by city
 */
export async function searchStoresByCity(city: string): Promise<APIResponse<Store[]>> {
  return apiClient.get<Store[]>(`/stores?city=${encodeURIComponent(city)}`)
}
