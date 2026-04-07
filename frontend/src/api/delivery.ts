/**
 * Delivery API - Server Functions (public, no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

export interface DeliveryZone {
  id: string
  name: string
  districts: string[]
  charge_type: 'fixed' | 'weight_based' | 'tiered'
  base_charge: number
  per_kg_charge: number | null
  free_above: number | null
  min_days: number
  max_days: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface DeliveryChargeResponse {
  zone_name: string
  charge_type: string
  base_charge: number
  weight_charge: number
  total_charge: number
  is_free: boolean
  free_above: number | null
  estimated_days: string
}

export const getDeliveryZones = createServerFn({ method: 'GET' })
  .handler(async () => {
    return apiRequest<ApiResponse<DeliveryZone[]>>('/delivery/zones')
  })

export const calculateDeliveryCharge = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { district: string; order_amount: number; weight_kg?: number } }) => {
    const params = new URLSearchParams({
      district: data.district,
      order_amount: String(data.order_amount),
      weight_kg: String(data.weight_kg ?? 0),
    })
    return apiRequest<ApiResponse<DeliveryChargeResponse>>(`/delivery/charges?${params}`)
  })

export function getDistrictsFromZones(zones: DeliveryZone[]): string[] {
  const districts = new Set<string>()
  for (const zone of zones) {
    for (const district of zone.districts) {
      districts.add(district)
    }
  }
  return Array.from(districts).sort()
}
