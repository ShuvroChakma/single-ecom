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

export interface ShippingAddress {
  full_name: string
  phone: string
  email: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  status: string
  payment_status: string
  payment_method: string
  shipping_address: ShippingAddress
  billing_address: ShippingAddress | null
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping_cost: number
  tax: number
  total: number
  promo_code: string | null
  notes: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
}

export interface CreateOrderRequest {
  shipping_address: ShippingAddress
  billing_address?: ShippingAddress
  payment_method: string
  notes?: string
  promo_code?: string
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  per_page: number
  pages: number
}

/**
 * Create a new order from cart
 */
export async function createOrder(data: CreateOrderRequest): Promise<APIResponse<Order>> {
  return apiClient.post<Order>('/orders', data)
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<APIResponse<Order>> {
  return apiClient.get<Order>(`/orders/${orderId}`)
}

/**
 * Get order by order number (for tracking)
 */
export async function getOrderByNumber(orderNumber: string): Promise<APIResponse<Order>> {
  return apiClient.get<Order>(`/orders/track/${orderNumber}`)
}

/**
 * Get user's orders
 */
export async function getMyOrders(page: number = 1, limit: number = 10): Promise<APIResponse<OrderListResponse>> {
  return apiClient.get<OrderListResponse>(`/orders/my?page=${page}&per_page=${limit}`)
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<APIResponse<Order>> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`, {})
}
