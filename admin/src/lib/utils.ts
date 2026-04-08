import {  clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type {ClassValue} from "clsx";

export function cn(...inputs: Array<ClassValue>) {
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
  // Prepend VITE_MEDIA_URL if set (dev or prod), otherwise relative (nginx handles it)
  const mediaUrl = import.meta.env.VITE_MEDIA_URL || ""
  return `${mediaUrl}${url}`
}
