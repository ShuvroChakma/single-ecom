import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

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
    items: ImageUploadResponse[]
    count: number
}

export const getCategoryImages = createServerFn({ method: "GET" })
    .handler(async () => {
        const token = getCookie("access_token")
        if (!token) throw new Error("Not authenticated")

        console.log("Fetching category images from backend...")

        try {
            const result = await apiRequest<ApiResponse<ImageListResponse>>('/admin/uploads/categories', {}, token)
            console.log("Category images fetched successfully:", result.success)
            // Unwrap and return only the plain data needed to avoid serialization issues
            return result.data.items
        } catch (error) {
            console.error("Error fetching category images:", error)
            throw error
        }
    })

// Media Library API functions
export interface PaginatedMediaResponse {
    items: ImageUploadResponse[]
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
}

export const getMediaImages = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data?: { page?: number; limit?: number } }) => {
        const token = getCookie("access_token")
        if (!token) throw new Error("Not authenticated")

        const page = data?.page || 1
        const limit = data?.limit || 20

        try {
            const result = await apiRequest<ApiResponse<PaginatedMediaResponse>>(
                `/admin/uploads/media?page=${page}&limit=${limit}`,
                {},
                token
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

    const API_URL = (typeof process !== 'undefined' && process.env?.API_URL)
        || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
        || "http://localhost:8000/api/v1";

    const response = await fetch(`${API_URL}/admin/uploads/media`, {
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
