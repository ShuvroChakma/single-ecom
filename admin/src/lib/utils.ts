import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a relative image path to a full URL in development.
 * In production, nginx handles this via reverse proxy.
 */
export function getImageUrl(url: string): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  // In development, prepend backend URL. In production, nginx handles it.
  if (import.meta.env.DEV) {
    const backendUrl = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || ""
    return `${backendUrl}${url}`
  }
  return url
}
