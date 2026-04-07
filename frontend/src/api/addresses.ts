/**
 * Addresses API - Server Functions (token from HttpOnly cookie)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { apiRequest, ApiResponse } from './client'

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

export const getAddresses = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<AddressListResponse>>('/addresses', {}, token)
  })

export const getAddress = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { addressId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Address>>(`/addresses/${data.addressId}`, {}, token)
  })

export const createAddress = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: AddressCreateRequest }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Address>>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  })

export const updateAddress = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { addressId: string; updates: AddressUpdateRequest } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Address>>(`/addresses/${data.addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data.updates),
    }, token)
  })

export const deleteAddress = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { addressId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<{ deleted: boolean }>>(`/addresses/${data.addressId}`, {
      method: 'DELETE',
    }, token)
  })

export const setDefaultAddress = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { addressId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Address>>(`/addresses/${data.addressId}/default`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }, token)
  })
