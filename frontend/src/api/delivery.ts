/**
 * Delivery API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

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

/**
 * Get active delivery zones (public)
 */
export async function getDeliveryZones(): Promise<APIResponse<DeliveryZone[]>> {
  return apiClient.get<DeliveryZone[]>('/delivery/zones')
}

/**
 * Calculate delivery charge for a district (public)
 */
export async function calculateDeliveryCharge(
  district: string,
  orderAmount: number,
  weightKg: number = 0
): Promise<APIResponse<DeliveryChargeResponse>> {
  const params = new URLSearchParams({
    district,
    order_amount: String(orderAmount),
    weight_kg: String(weightKg),
  })
  return apiClient.get<DeliveryChargeResponse>(`/delivery/charges?${params}`)
}

/**
 * Get all unique districts from delivery zones
 */
export function getDistrictsFromZones(zones: DeliveryZone[]): string[] {
  const districts = new Set<string>()
  for (const zone of zones) {
    for (const district of zone.districts) {
      districts.add(district)
    }
  }
  return Array.from(districts).sort()
}
