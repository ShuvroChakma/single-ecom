import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Package, ChevronRight, ShoppingBag, ChevronLeft } from 'lucide-react'
import { getOrdersList } from '@/api/orders'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export const Route = createFileRoute('/orders/')({
  component: OrdersPage,
})

const PAGE_LIMIT = 10

function OrdersPage() {
  return (
    <div>
      <Header />
      <OrdersContent />
      <Footer />
    </div>
  )
}

function OrdersContent() {
  const [page, setPage] = useState(0)
  const offset = page * PAGE_LIMIT

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => getOrdersList({ data: { limit: PAGE_LIMIT, offset } }),
  })

  const orders = data?.data || []
  const hasNext = orders.length === PAGE_LIMIT
  const hasPrev = page > 0

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
          <Link to="/" className="text-header hover:underline">Go back home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-header" size={24} />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your orders</p>
        </div>

        {orders.length === 0 && page === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="mx-auto text-gray-200 mb-4" size={56} />
              <h2 className="text-lg font-semibold text-gray-700 mb-1">No orders yet</h2>
              <p className="text-sm text-gray-400 mb-6">Start shopping to see your orders here</p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block group"
                >
                  <Card className="hover:border-header/30 hover:shadow-md transition-all">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-header text-sm">#{order.order_number}</span>
                            <Badge variant={order.status.toLowerCase() as any}>{order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}</Badge>
                            <Badge variant={order.payment_status.toLowerCase() as any}>{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1).toLowerCase()}</Badge>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                            {' · '}
                            {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <p className="text-base font-bold text-gray-900">
                            ৳{Number(order.total).toLocaleString()}
                          </p>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-header transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {(hasPrev || hasNext) && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev || isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
