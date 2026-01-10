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
