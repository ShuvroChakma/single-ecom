import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Package, MapPin, CreditCard, ArrowLeft, X, Check, Truck, Clock, ShoppingBag } from 'lucide-react'
import { getOrder, cancelOrder } from '@/api/orders'
import { getImageUrl } from '@/api/client'
import { useState } from 'react'

export const Route = createFileRoute('/orders/$id')({
  component: OrderDetailPage,
})

const ORDER_STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Package }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Check },
  processing: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Package },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: Check },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
}

function OrderDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      setShowCancelConfirm(false)
    },
  })

  const order = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-header" size={40} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Order not found</p>
          <Link to="/orders" className="text-header hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending
  const StatusIcon = statusInfo.icon
  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const shippingAddress = order.shipping_address as Record<string, any>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate({ to: '/orders' })}
            className="flex items-center gap-2 text-gray-600 hover:text-header mb-4"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
              <p className="text-gray-500">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.bg} ${statusInfo.text}`}>
              <StatusIcon size={20} />
              <span className="font-semibold">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Order Progress</h2>
            <div className="flex justify-between">
              {ORDER_STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isActive = index === currentStepIndex

                return (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                      ${isActive ? 'ring-2 ring-green-300' : ''}
                    `}>
                      {isCompleted ? <Check size={16} /> : index + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                    {index < ORDER_STATUS_STEPS.length - 1 && (
                      <div className={`
                        hidden sm:block absolute h-0.5 w-full top-4 left-1/2
                        ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag size={20} />
                Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <img
                      src={getImageUrl(item.product_image, '/placeholder-product.jpg')}
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">SKU: {item.variant_sku}</p>
                      {item.metal_type && (
                        <p className="text-sm text-gray-500">
                          {item.metal_type} {item.metal_purity}
                          {item.size && ` • Size ${item.size}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">৳{Number(item.line_total).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">৳{Number(item.unit_price).toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Shipping Address
              </h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-900">{shippingAddress.full_name}</p>
                <p>{shippingAddress.phone}</p>
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.district}
                  {shippingAddress.postal_code && ` - ${shippingAddress.postal_code}`}
                </p>
              </div>
            </div>

            {/* Gift Message */}
            {order.is_gift && order.gift_message && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold mb-2">Gift Message</h2>
                <p className="text-gray-600 italic">"{order.gift_message}"</p>
              </div>
            )}

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold mb-2">Order Notes</h2>
                <p className="text-gray-600">{order.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span>৳{Number(order.delivery_charge).toLocaleString()}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>৳{Number(order.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>Total</span>
                  <span className="text-header">৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-gray-500" />
                  <span className="font-medium">Payment</span>
                </div>
                <p className="text-sm text-gray-600 capitalize">{order.payment_method}</p>
                <p className={`text-sm ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </p>
              </div>

              {/* Promo Code */}
              {order.promo_code && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Promo Code Applied:</p>
                  <p className="font-medium text-green-600">{order.promo_code}</p>
                </div>
              )}

              {/* Cancel Button */}
              {canCancel && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Cancel Order?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {cancelMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
