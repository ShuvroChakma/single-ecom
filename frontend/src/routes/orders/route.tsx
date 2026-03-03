import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Package, ChevronRight, ShoppingBag } from 'lucide-react'
import { getOrdersList } from '@/api/orders'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  processing: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-800' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

function OrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getOrdersList({ data: { limit: 50, offset: 0 } }),
  })

  const orders = data?.data || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-header" size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load orders</p>
          <Link to="/" className="text-header hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-header" />
            My Orders
          </h1>
          <p className="text-gray-500 mt-1">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={60} />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-header text-white rounded font-semibold hover:opacity-90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusColors = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending
              const paymentColors = PAYMENT_STATUS_COLORS[order.payment_status] || PAYMENT_STATUS_COLORS.pending

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-header">#{order.order_number}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentColors.bg} ${paymentColors.text}`}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.item_count} item{order.item_count > 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-header">৳{order.total.toLocaleString()}</p>
                        </div>
                        <ChevronRight className="text-gray-400" size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
