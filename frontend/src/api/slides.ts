/**
 * Slides/Banners API - Server Functions (public, no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

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

export const getHomeCarouselSlides = createServerFn({ method: 'GET' })
  .handler(async () => {
    return apiRequest<ApiResponse<Slide[]>>('/slides?position=home_carousel')
  })

export const getHomeBannerSlides = createServerFn({ method: 'GET' })
  .handler(async () => {
    return apiRequest<ApiResponse<Slide[]>>('/slides?position=home_banner')
  })

export const getPromoSlides = createServerFn({ method: 'GET' })
  .handler(async () => {
    return apiRequest<ApiResponse<Slide[]>>('/slides?position=promo')
  })

export const getSlides = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { position?: string } }) => {
    const url = data?.position ? `/slides?position=${data.position}` : '/slides'
    return apiRequest<ApiResponse<Slide[]>>(url)
  })
