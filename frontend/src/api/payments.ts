/**
 * Payments API - Server Functions (public, no auth needed)
 */
import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

export interface PaymentMethod {
  code: string
  name: string
  description: string | null
  logo_url: string | null
  min_amount: number | null
  max_amount: number | null
}

export interface PaymentMethodsResponse {
  methods: PaymentMethod[]
}

export const getPaymentMethods = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { order_amount?: number } }) => {
    const params = data?.order_amount ? `?order_amount=${data.order_amount}` : ''
    return apiRequest<ApiResponse<PaymentMethodsResponse>>(`/payments/methods${params}`)
  })

export function getPaymentLogo(method: PaymentMethod): string {
  if (method.logo_url) return method.logo_url
  const defaultLogos: Record<string, string> = {
    cod: 'https://cdn-icons-png.flaticon.com/128/2331/2331941.png',
    bkash: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg',
    nagad: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png',
    rocket: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png',
    sslcommerz: 'https://sslcommerz.com/wp-content/uploads/2021/11/logo.png',
    amarpay: 'https://www.aamarpay.com/images/logo/aamarpay_logo.png',
  }
  return defaultLogos[method.code] || 'https://cdn-icons-png.flaticon.com/128/633/633611.png'
}
