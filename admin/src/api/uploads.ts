import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export interface ImageUploadResponse {
    url: string
    filename: string
}

export async function uploadCategoryImage(file: File, type: 'icon' | 'banner' = 'icon', token?: string) {
    const formData = new FormData()
    formData.append('file', file)

    if (!token) {
        throw new Error('Not authenticated')
    }

    return apiRequest<ImageUploadResponse>('/admin/uploads/categories?type=' + type, {
        method: 'POST',
        body: formData,
    }, token)
}

export interface ImageListResponse {
    items: Array<ImageUploadResponse>
    count: number
}

export const getCategoryImages = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const result = await authenticatedRequest<ApiResponse<ImageListResponse>>('/admin/uploads/categories')
            return result.data.items
        } catch (error) {
            console.error("Error fetching category images:", error)
            throw error
        }
    })

// Media Library API functions
export interface PaginatedMediaResponse {
    items: Array<ImageUploadResponse>
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
}

export const getMediaImages = createServerFn({ method: "GET" })
    .handler(async ({ data }: { data?: { page?: number; limit?: number } }) => {
        const page = data?.page || 1
        const limit = data?.limit || 20

        try {
            const result = await authenticatedRequest<ApiResponse<PaginatedMediaResponse>>(
                `/admin/uploads/media?page=${page}&limit=${limit}`
            )
            return result.data
        } catch (error) {
            console.error("Error fetching media images:", error)
            throw error
        }
    })

export async function uploadMediaImage(file: File, token?: string): Promise<ImageUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    if (!token) {
        throw new Error('Not authenticated')
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

    const response = await fetch(`${apiUrl}/admin/uploads/media`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload failed" }))
        throw new Error(error.message || "Failed to upload image")
    }

    const result = await response.json()
    return result.data
}
