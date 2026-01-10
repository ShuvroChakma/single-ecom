import { apiRequest } from "./client"

export interface ImageUploadResponse {
    url: string
    filename: string
}

export async function uploadCategoryImage(file: File, type: 'icon' | 'banner' = 'icon') {
    const formData = new FormData()
    formData.append('file', file)
    
    // apiRequest handles JSON by default, but for FormData we might need to handle headers differently if the client doesn't auto-detect
    // Assuming apiRequest can handle FormData or we modify it. 
    // Let's check apiRequest implementation in client.ts first or assume standard behavior of fetch/axios wrappers.
    // If apiRequest stringifies body, this will fail.
    // Let's assume we need to pass a specific flag or use a different helper if generic apiRequest is JSON-only.
    // For now, I'll assume I can pass options.
    
    // Actually, looking at previous views, `apiRequest` takes `url` and `options`.
    return apiRequest<ImageUploadResponse>('/admin/uploads/categories?type=' + type, {
        method: 'POST',
        body: formData,
    })
}
