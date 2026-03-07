/**
 * Settings API - public endpoint (no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

export interface SiteSettings {
  // General
  store_name: string
  store_tagline: string
  store_logo: string
  store_favicon: string
  currency: string
  currency_symbol: string
  // Contact
  contact_email: string
  contact_phone: string
  contact_address: string
  support_email: string
  whatsapp_number: string
  // Social
  facebook_url: string
  instagram_url: string
  youtube_url: string
  twitter_url: string
  pinterest_url: string
  // SEO
  meta_title: string
  meta_description: string
  // Appearance
  primary_color: string
  secondary_color: string
  accent_color: string
  // Shipping
  free_shipping_threshold: string
  default_shipping_days_min: string
  default_shipping_days_max: string
}

export interface SettingsGrouped {
  general: Record<string, string>
  contact: Record<string, string>
  social: Record<string, string>
  shipping: Record<string, string>
  seo: Record<string, string>
  appearance: Record<string, string>
}

export const getPublicSettings = createServerFn({ method: 'GET' })
  .handler(async () => {
    return apiRequest<ApiResponse<SettingsGrouped>>('/settings')
  })
