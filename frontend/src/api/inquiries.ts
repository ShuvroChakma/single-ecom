/**
 * Inquiries API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface InquiryCreateData {
  type?: 'CUSTOM_JEWELLERY' | 'GENERAL' | 'SUPPORT' | 'FEEDBACK'
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  metal_type?: string
  budget_range?: string
}

export interface CustomJewelleryData {
  name: string
  email: string
  phone: string
  metal_type: string
  budget_range: string
  message: string
  design_image?: File
}

export interface InquiryCreatedResponse {
  id: string
  message: string
}

export interface InquiryResponse {
  id: string
  type: string
  status: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  metal_type: string | null
  budget_range: string | null
  design_image: string | null
  created_at: string
  updated_at: string
}

/**
 * Submit a general inquiry
 */
export async function submitInquiry(data: InquiryCreateData): Promise<APIResponse<InquiryCreatedResponse>> {
  return apiClient.post<InquiryCreatedResponse>('/inquiries', data)
}

/**
 * Submit a custom jewellery request (with file upload support)
 */
export async function submitCustomJewelleryRequest(data: CustomJewelleryData): Promise<APIResponse<InquiryCreatedResponse>> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('email', data.email)
  formData.append('phone', data.phone)
  formData.append('metal_type', data.metal_type)
  formData.append('budget_range', data.budget_range)
  formData.append('message', data.message)

  if (data.design_image) {
    formData.append('design_image', data.design_image)
  }

  // Use fetch directly for multipart form data
  const response = await fetch(`${import.meta.env.VITE_API_URL}/inquiries/custom-jewellery`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok) {
    return {
      success: false,
      message: result.message || 'Failed to submit request',
      data: null as any,
    }
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  }
}

/**
 * Get my inquiries (logged in users)
 */
export async function getMyInquiries(): Promise<APIResponse<InquiryResponse[]>> {
  return apiClient.get<InquiryResponse[]>('/inquiries/my')
}
