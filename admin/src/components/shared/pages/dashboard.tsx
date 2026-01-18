"use client"

import { useMemo, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  BarChart3,
} from "lucide-react"
import { getDashboardData, DashboardData } from "@/api/dashboard"

// Memoized stat card component for performance
const StatCard = memo(function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  isLoading,
}: {
  title: string
  value: string
  subValue?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && (
              <p className={`text-xs flex items-center gap-1 ${
                trend === "up" ? "text-green-600" :
                trend === "down" ? "text-red-600" : "text-muted-foreground"
              }`}>
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {subValue}
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Memoized recent orders table row
const OrderRow = memo(function OrderRow({
  order,
  onClick,
}: {
  order: DashboardData["recent_orders"][0]
  onClick: () => void
}) {
  const statusVariant = useMemo(() => {
    switch (order.status) {
      case "DELIVERED":
        return "default"
      case "PENDING":
        return "secondary"
      case "CANCELLED":
      case "REFUNDED":
        return "destructive"
      default:
        return "outline"
    }
  }, [order.status])

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
      <TableCell>{order.customer_name}</TableCell>
      <TableCell>
        <Badge variant={statusVariant}>{order.status}</Badge>
      </TableCell>
      <TableCell className="text-right font-semibold">
        ৳{parseFloat(String(order.total)).toLocaleString()}
      </TableCell>
    </TableRow>
  )
})

// Main dashboard component
export default function AdminDashboard() {
  const navigate = useNavigate()

  // Single optimized query for all dashboard data
  // Uses stale-while-revalidate pattern with 30 second refresh
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true,
  })

  const dashboardData = data?.success ? data.data : null

  // Memoized computed values
  const stats = useMemo(() => {
    if (!dashboardData?.stats) return null
    const s = dashboardData.stats
    return [
      {
        title: "Total Orders",
        value: s.total_orders.toLocaleString(),
        subValue: `${s.orders_today} today`,
        icon: ShoppingCart,
        trend: s.orders_today > 0 ? "up" as const : "neutral" as const,
      },
      {
        title: "Total Revenue",
        value: `৳${parseFloat(String(s.total_revenue)).toLocaleString()}`,
        subValue: `৳${parseFloat(String(s.revenue_today)).toLocaleString()} today`,
        icon: DollarSign,
        trend: parseFloat(String(s.revenue_today)) > 0 ? "up" as const : "neutral" as const,
      },
      {
        title: "Customers",
        value: s.total_customers.toLocaleString(),
        icon: Users,
      },
      {
        title: "Products",
        value: s.total_products.toLocaleString(),
        icon: Package,
      },
    ]
  }, [dashboardData?.stats])

  const pendingOrdersCount = dashboardData?.stats?.pending_orders ?? 0

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your store performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrdersCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                {pendingOrdersCount} pending order{pendingOrdersCount > 1 ? "s" : ""} require attention
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/dashboard/orders" })}
            >
              View Orders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCard title="" value="" icon={ShoppingCart} isLoading />
            <StatCard title="" value="" icon={DollarSign} isLoading />
            <StatCard title="" value="" icon={Users} isLoading />
            <StatCard title="" value="" icon={Package} isLoading />
          </>
        ) : (
          stats?.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              subValue={stat.subValue}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))
        )}
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/dashboard/orders" })}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : dashboardData?.recent_orders && dashboardData.recent_orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recent_orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onClick={() => navigate({ to: "/dashboard/orders" })}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p>No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : dashboardData?.low_stock_products && dashboardData.low_stock_products.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.low_stock_products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.variant_info || product.sku}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {product.stock_quantity} left
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => navigate({ to: "/dashboard/products" })}
                >
                  Manage Inventory
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mb-2" />
                <p className="text-sm">All products well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales Overview (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-end justify-between h-48 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton className="w-full" style={{ height: `${Math.random() * 100 + 50}px` }} />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          ) : dashboardData?.sales_chart && dashboardData.sales_chart.length > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart */}
              <div className="flex items-end justify-between h-48 gap-2">
                {dashboardData.sales_chart.map((point) => {
                  const maxRevenue = Math.max(
                    ...dashboardData.sales_chart.map((p) => parseFloat(String(p.revenue)))
                  )
                  const height = maxRevenue > 0
                    ? (parseFloat(String(point.revenue)) / maxRevenue) * 100
                    : 0

                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/30 rounded-t transition-colors relative group"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                          style={{ height: `${height > 0 ? 100 : 0}%` }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-popover border rounded-md px-2 py-1 text-xs hidden group-hover:block whitespace-nowrap z-10">
                          <p className="font-semibold">{formatCurrency(parseFloat(String(point.revenue)))}</p>
                          <p className="text-muted-foreground">{point.orders} orders</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{point.date}</span>
                    </div>
                  )
                })}
              </div>
              {/* Summary */}
              <div className="flex justify-between pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-semibold">
                    {dashboardData.sales_chart.reduce((sum, p) => sum + p.orders, 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      dashboardData.sales_chart.reduce(
                        (sum, p) => sum + parseFloat(String(p.revenue)),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-2" />
              <p>No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Distribution */}
      {dashboardData?.order_status_counts && dashboardData.order_status_counts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {dashboardData.order_status_counts.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                >
                  <Badge
                    variant={
                      status.status === "DELIVERED" ? "default" :
                      status.status === "PENDING" ? "secondary" :
                      status.status === "CANCELLED" || status.status === "REFUNDED" ? "destructive" :
                      "outline"
                    }
                  >
                    {status.status}
                  </Badge>
                  <span className="font-semibold">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
