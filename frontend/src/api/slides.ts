/**
 * Slides/Banners API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface Slide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  link_text: string | null
  position: string
  display_order: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface SlideListResponse {
  items: Slide[]
  total: number
}

/**
 * Get slides by position (public endpoint)
 */
export async function getSlides(position?: string): Promise<APIResponse<Slide[]>> {
  const url = position ? `/slides?position=${position}` : '/slides'
  return apiClient.get<Slide[]>(url)
}

/**
 * Get homepage carousel slides
 */
export async function getHomeCarouselSlides(): Promise<APIResponse<Slide[]>> {
  return apiClient.get<Slide[]>('/slides?position=home_carousel')
}

/**
 * Get homepage banner slides
 */
export async function getHomeBannerSlides(): Promise<APIResponse<Slide[]>> {
  return apiClient.get<Slide[]>('/slides?position=home_banner')
}

/**
 * Get promotional slides
 */
export async function getPromoSlides(): Promise<APIResponse<Slide[]>> {
  return apiClient.get<Slide[]>('/slides?position=promo')
}
