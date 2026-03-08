/**
 * Gift Cards API - Server Functions (token from HttpOnly cookie)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { apiRequest, ApiResponse } from './client'

export interface GiftCardValidationResult {
  valid: boolean
  remaining_balance: number
  currency: string
  expires_at: string | null
  message: string
}

export const validateGiftCard = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { code: string } }) => {
    // /gift-cards/validate is a public endpoint — no auth required
    const token = getCookie('access_token')
    return apiRequest<ApiResponse<GiftCardValidationResult>>('/gift-cards/validate', {
      method: 'POST',
      body: JSON.stringify({ code: data.code }),
    }, token ?? undefined)
  })
