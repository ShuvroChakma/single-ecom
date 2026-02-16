/**
 * Addresses API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface Address {
  id: string
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  district: string
  postal_code: string | null
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface AddressListResponse {
  addresses: Address[]
  count: number
  max_allowed: number
}

export interface AddressCreateRequest {
  label?: string
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  district: string
  postal_code?: string
  country?: string
  is_default?: boolean
}

export interface AddressUpdateRequest {
  label?: string
  full_name?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  district?: string
  postal_code?: string
  country?: string
  is_default?: boolean
}

/**
 * Get all addresses for current customer
 */
export async function getAddresses(): Promise<APIResponse<AddressListResponse>> {
  return apiClient.get<AddressListResponse>('/addresses')
}

/**
 * Get a single address by ID
 */
export async function getAddress(addressId: string): Promise<APIResponse<Address>> {
  return apiClient.get<Address>(`/addresses/${addressId}`)
}

/**
 * Create a new address
 */
export async function createAddress(data: AddressCreateRequest): Promise<APIResponse<Address>> {
  return apiClient.post<Address>('/addresses', data)
}

/**
 * Update an existing address
 */
export async function updateAddress(addressId: string, data: AddressUpdateRequest): Promise<APIResponse<Address>> {
  return apiClient.put<Address>(`/addresses/${addressId}`, data)
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<APIResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`/addresses/${addressId}`)
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(addressId: string): Promise<APIResponse<Address>> {
  return apiClient.patch<Address>(`/addresses/${addressId}/default`, {})
}
