import { createServerFn } from "@tanstack/react-start"
import { authenticatedRequest } from "./server-utils"
import type { ApiResponse } from "./client"

export type InquiryType = "CUSTOM_JEWELLERY" | "GENERAL" | "SUPPORT" | "FEEDBACK"
export type InquiryStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"

export interface Inquiry {
  id: string
  type: InquiryType
  status: InquiryStatus
  customer_id: string | null
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  metal_type: string | null
  budget_range: string | null
  design_image: string | null
  admin_notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface PaginatedInquiriesResponse {
  items: Array<Inquiry>
  total: number
  page: number
  per_page: number
  pages: number
}

export const getInquiries = createServerFn({ method: "GET" })
  .inputValidator((data?: { type?: InquiryType; status?: InquiryStatus; page?: number; per_page?: number }) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams()
    if (data?.type) params.append("inquiry_type", data.type)
    if (data?.status) params.append("status", data.status)
    if (data?.page) params.append("page", data.page.toString())
    if (data?.per_page) params.append("per_page", data.per_page.toString())

    return authenticatedRequest<ApiResponse<PaginatedInquiriesResponse>>(
      `/inquiries/admin?${params.toString()}`
    )
  })

export const getInquiry = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Inquiry>>(`/inquiries/admin/${data.id}`)
  })

export const updateInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status?: InquiryStatus; admin_notes?: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...payload } = data
    return authenticatedRequest<ApiResponse<Inquiry>>(
      `/inquiries/admin/${id}`,
      { method: "PUT", body: JSON.stringify(payload) }
    )
  })
