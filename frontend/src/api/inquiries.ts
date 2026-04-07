/**
 * Inquiries API - Server Functions (public + auth)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { API_BASE, apiRequest  } from './client'
import type { ApiResponse  } from './client';

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
  website?: string  // honeypot
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

const inquirySchema = z.object({
  type: z.enum(['CUSTOM_JEWELLERY', 'GENERAL', 'SUPPORT', 'FEEDBACK']).optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  subject: z.string(),
  message: z.string(),
  metal_type: z.string().optional(),
  budget_range: z.string().optional(),
})

export const submitInquiry = createServerFn({ method: 'POST' })
  .inputValidator(inquirySchema)
  .handler(async ({ data }) => {
    return apiRequest<ApiResponse<InquiryCreatedResponse>>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  })

/**
 * Submit a custom jewellery request (with file upload support)
 * Uses client-side fetch due to multipart form data
 */
export async function submitCustomJewelleryRequest(data: CustomJewelleryData): Promise<{ success: boolean; message?: string; data: InquiryCreatedResponse | null }> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('email', data.email)
  formData.append('phone', data.phone)
  formData.append('metal_type', data.metal_type)
  formData.append('budget_range', data.budget_range)
  formData.append('message', data.message)
  formData.append('website', data.website || '')

  if (data.design_image) {
    formData.append('design_image', data.design_image)
  }

  const response = await fetch(`${API_BASE}/inquiries/custom-jewellery`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok) {
    return {
      success: false,
      message: result.message || 'Failed to submit request',
      data: null,
    }
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  }
}

export const getMyInquiries = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Array<InquiryResponse>>>('/inquiries/my', {}, token)
  })
