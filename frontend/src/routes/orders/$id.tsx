import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2, Package, MapPin, CreditCard, ArrowLeft, X, Check,
  Truck, Clock, ShoppingBag, Gift, StickyNote, Tag, AlertTriangle,
} from 'lucide-react'
import { getOrder, cancelOrder } from '@/api/orders'
import { getImageUrl, getErrorMessage } from '@/api/client'
import { formatDateTime } from '@/lib/date'
import { useState } from 'react'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/orders/$id')({
  component: OrderDetailPage,
})

function OrderDetailPage() {
  return (
    <div>
      <Header />
      <OrderDetailContent />
      <Footer />
    </div>
  )
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

const STATUS_META: Record<string, { label: string; icon: typeof Package; badgeVariant: string }> = {
  pending:    { label: 'Pending',    icon: Clock,    badgeVariant: 'pending' },
  confirmed:  { label: 'Confirmed',  icon: Check,    badgeVariant: 'confirmed' },
  processing: { label: 'Processing', icon: Package,  badgeVariant: 'processing' },
  shipped:    { label: 'Shipped',    icon: Truck,    badgeVariant: 'shipped' },
  delivered:  { label: 'Delivered',  icon: Check,    badgeVariant: 'delivered' },
  cancelled:  { label: 'Cancelled',  icon: X,        badgeVariant: 'cancelled' },
}

const PAYMENT_STATUS_META: Record<string, { badgeVariant: string }> = {
  pending:  { badgeVariant: 'pending' },
  paid:     { badgeVariant: 'paid' },
  failed:   { badgeVariant: 'failed' },
  refunded: { badgeVariant: 'refunded' },
}

function OrderDetailContent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const { isAuthenticated } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder({ data: { orderId: id } }),
    enabled: isAuthenticated,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder({ data: { orderId: id } }),
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
          <p className="text-red-500 mb-2">
            {error ? getErrorMessage(error) : 'Order not found'}
          </p>
          <Link to="/orders" className="text-header hover:underline text-sm">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const status = order.status.toLowerCase()
  const paymentStatus = order.payment_status.toLowerCase()
  const statusMeta = STATUS_META[status] ?? STATUS_META.pending
  const StatusIcon = statusMeta.icon
  const currentStepIndex = STATUS_STEPS.indexOf(status as any)
  const canCancel = ['pending', 'confirmed'].includes(status)
  const shippingAddress = order.shipping_address as Record<string, string>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate({ to: '/orders' })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-header mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.order_number}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Placed on{' '}
                {formatDateTime(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={statusMeta.badgeVariant as any} className="text-sm px-3 py-1">
                <StatusIcon size={13} />
                {statusMeta.label}
              </Badge>
              <Badge
                variant={(PAYMENT_STATUS_META[paymentStatus]?.badgeVariant ?? 'pending') as any}
                className="text-sm px-3 py-1"
              >
                {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {status !== 'cancelled' && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="relative flex justify-between">
                {/* connecting line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 mx-8" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-emerald-500 mx-8 transition-all duration-500"
                  style={{
                    width: currentStepIndex < 0
                      ? '0%'
                      : `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                  }}
                />

                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isActive = index === currentStepIndex
                  return (
                    <div key={step} className="flex flex-col items-center relative z-10">
                      <div
                        className={[
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400',
                          isActive ? 'ring-2 ring-emerald-200 ring-offset-1' : '',
                        ].join(' ')}
                      >
                        {isCompleted ? <Check size={14} /> : index + 1}
                      </div>
                      <span
                        className={[
                          'text-xs mt-2 font-medium text-center hidden sm:block',
                          isActive
                            ? 'text-emerald-600'
                            : isCompleted
                            ? 'text-gray-700'
                            : 'text-gray-400',
                        ].join(' ')}
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <ShoppingBag size={18} className="text-header" />
                  Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-50 p-0!">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-5">
                    <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      <img
                        src={getImageUrl(item.product_image, '/placeholder-product.jpg')}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">SKU: {item.variant_sku}</p>
                      {item.metal_type && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.metal_type}
                          {item.metal_purity ? ` ${item.metal_purity}` : ''}
                          {item.metal_color ? ` · ${item.metal_color}` : ''}
                          {item.size ? ` · Size ${item.size}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">
                        ৳{Number(item.line_total).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ৳{Number(item.unit_price).toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <MapPin size={18} className="text-header" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-0.5 text-gray-600">
                  <p className="font-semibold text-gray-900">{shippingAddress.full_name}</p>
                  <p>{shippingAddress.phone}</p>
                  <p>{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>
                    {shippingAddress.city}, {shippingAddress.district}
                    {shippingAddress.postal_code ? ` - ${shippingAddress.postal_code}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Gift Message */}
            {order.is_gift && order.gift_message && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Gift size={18} className="text-header" />
                    Gift Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 italic">"{order.gift_message}"</p>
                </CardContent>
              </Card>
            )}

            {/* Customer Notes */}
            {order.customer_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <StickyNote size={18} className="text-header" />
                    Order Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.customer_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="text-gray-900">৳{Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className="text-gray-900">৳{Number(order.delivery_charge).toLocaleString()}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>−৳{Number(order.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(order.tax_amount) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span className="text-gray-900">৳{Number(order.tax_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2.5 border-t border-gray-100 flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span className="text-header">৳{Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <CreditCard size={18} className="text-header" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Method</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Status</span>
                      <Badge
                        variant={(PAYMENT_STATUS_META[paymentStatus]?.badgeVariant ?? 'pending') as any}
                      >
                        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promo Code */}
              {order.promo_code && (
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={14} className="text-emerald-600" />
                      <span className="text-gray-500">Promo applied:</span>
                      <span className="font-medium text-emerald-700">{order.promo_code}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cancel */}
              {canCancel && (
                <Button
                  variant="outline-destructive"
                  className="w-full"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cancel this order?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
