/**
 * Orders API functions
 */
import { apiClient } from '@/utils/api-client'
import type { APIResponse } from '@/types/api.types'

export interface OrderItem {
  id: string
  product_id: string
  variant_id: string
  product_name: string
  product_image: string | null
  variant_sku: string
  variant_info: string
  quantity: number
  unit_price: number
  subtotal: number
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

/**
 * Create a new order from cart
 */
export async function createOrder(data: CreateOrderRequest): Promise<APIResponse<OrderCreatedResponse>> {
  return apiClient.post<OrderCreatedResponse>('/orders', data)
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<APIResponse<Order>> {
  return apiClient.get<Order>(`/orders/${orderId}`)
}

/**
 * Get list of orders (simpler response)
 */
export async function getOrdersList(limit: number = 20, offset: number = 0): Promise<APIResponse<OrderListItem[]>> {
  return apiClient.get<OrderListItem[]>(`/orders?limit=${limit}&offset=${offset}`)
}

/**
 * Get user's orders
 */
export async function getMyOrders(limit: number = 20, offset: number = 0): Promise<APIResponse<Order[]>> {
  return apiClient.get<Order[]>(`/orders?limit=${limit}&offset=${offset}`)
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<APIResponse<Order>> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`, {})
}
