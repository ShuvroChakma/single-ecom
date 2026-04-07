import { createServerFn } from '@tanstack/react-start'
import { apiRequest, ApiResponse } from './client'

export interface DailyRate {
  id: string
  metal_type: string
  purity: string
  rate_per_gram: number
  currency: string
  source: string
  effective_date: string
  created_at: string
}

export interface CurrentRatesResponse {
  rates: DailyRate[]
  last_updated: string
}

export const getCurrentRates = createServerFn({ method: 'GET' }).handler(async () => {
  return apiRequest<ApiResponse<CurrentRatesResponse>>('/products/rates/current')
})
