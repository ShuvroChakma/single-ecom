/**
 * Stores API - Server Functions (public, no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

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

export const getStores = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { city?: string } }) => {
    const url = data?.city ? `/stores?city=${encodeURIComponent(data.city)}` : '/stores'
    return apiRequest<ApiResponse<Store[]>>(url)
  })

export const getStore = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { storeId: string } }) => {
    return apiRequest<ApiResponse<Store>>(`/stores/${data.storeId}`)
  })

export const findNearbyStores = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { lat: number; lng: number; radiusKm?: number } }) => {
    const { lat, lng, radiusKm = 50 } = data
    return apiRequest<ApiResponse<Store[]>>(`/stores/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`)
  })
