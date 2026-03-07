/**
 * Orders API - Server Functions (token from HttpOnly cookie)
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { apiRequest, ApiResponse } from './client'

export interface OrderItem {
  id: string
  product_id: string
  variant_id: string
  product_name: string
  product_image: string | null
  variant_sku: string
  metal_type: string | null
  metal_purity: string | null
  metal_color: string | null
  size: string | null
  quantity: number
  unit_price: number
  line_total: number
  net_weight: number | null
}

export interface OrderListItem {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  item_count: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  is_pos_order: boolean
  pos_customer_name: string | null
  pos_customer_phone: string | null
  status: string
  payment_status: string
  payment_method: string
  payment_transaction_id: string | null
  shipping_address: Record<string, any>
  is_gift: boolean
  gift_message: string | null
  hide_prices: boolean
  items: OrderItem[]
  subtotal: number
  discount_amount: number
  delivery_charge: number
  tax_amount: number
  total: number
  currency: string
  promo_code: string | null
  customer_notes: string | null
  created_at: string
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  paid_at: string | null
}

export interface CreateOrderRequest {
  address_id: string
  payment_method: string
  is_gift?: boolean
  gift_message?: string
  hide_prices?: boolean
  promo_code?: string
  notes?: string
}

export interface OrderCreatedResponse {
  order_id: string
  order_number: string
  payment_method: string
  total: number
  requires_payment: boolean
  payment_url: string | null
  message: string
}

export const createOrder = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: CreateOrderRequest }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<OrderCreatedResponse>>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  })

export const getOrder = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { orderId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Order>>(`/orders/${data.orderId}`, {}, token)
  })

export const getOrdersList = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data?: { limit?: number; offset?: number } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    const limit = data?.limit ?? 20
    const offset = data?.offset ?? 0
    return apiRequest<ApiResponse<OrderListItem[]>>(`/orders?limit=${limit}&offset=${offset}`, {}, token)
  })

export const cancelOrder = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { orderId: string } }) => {
    const token = getCookie('access_token')
    if (!token) return { success: false, message: 'Not authenticated', data: null } as any
    return apiRequest<ApiResponse<Order>>(`/orders/${data.orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, token)
  })
