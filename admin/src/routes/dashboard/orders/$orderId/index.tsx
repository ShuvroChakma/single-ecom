import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ArrowLeft, MapPin, Package, CreditCard, StickyNote, History } from "lucide-react"

import { Order, OrderStatus, getOrder } from "@/api/orders"
import { OrderStatusDialog } from "@/components/shared/order-status-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { fmtDateTimeLong } from "@/lib/date"

export const Route = createFileRoute("/dashboard/orders/$orderId/")({
    component: OrderDetailPage,
})

const statusVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" =>
    ["CANCELLED", "REFUNDED"].includes(status) ? "destructive"
    : ["PENDING", "RETURNED"].includes(status) ? "secondary"
    : "default"

function OrderDetailPage() {
    const { orderId } = Route.useParams()
    const navigate = useNavigate()
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ["order", orderId],
        queryFn: () => getOrder({ data: { id: orderId } }),
    })

    const order: Order | null = data?.success ? data.data : null

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-60 w-full" />
                    </div>
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">Order not found.</p>
                <Button variant="outline" onClick={() => navigate({ to: "/dashboard/orders" })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Button>
            </div>
        )
    }

    const fmt = (n: number | string) => `৳${parseFloat(String(n)).toLocaleString()}`

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => navigate({ to: "/dashboard/orders" })}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                            <h1 className="text-xl font-bold tracking-tight truncate">Order #{order.order_number}</h1>
                            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{fmtDateTimeLong(order.created_at)}</p>
                    </div>
                </div>
                <Button onClick={() => setIsStatusDialogOpen(true)} className="shrink-0 w-full sm:w-auto">
                    Update Status
                </Button>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — Items + Shipping */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Items */}
                    <div className="rounded-lg border">
                        <div className="px-5 py-3.5 border-b bg-muted/40">
                            <h2 className="font-semibold text-sm">Items ({order.items.length})</h2>
                        </div>
                        <div className="divide-y">
                            {order.items.map((item) => (
                                <div key={item.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="font-medium text-sm">{item.product_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            SKU: {item.variant_sku} &nbsp;·&nbsp; Qty: {item.quantity}
                                            {item.metal_type && ` · ${item.metal_type} ${item.metal_purity ?? ""}`}
                                            {item.metal_color && ` · ${item.metal_color}`}
                                            {item.size && ` · Size ${item.size}`}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-sm shrink-0">{fmt(item.line_total)}</p>
                                </div>
                            ))}
                        </div>
                        {/* Totals inside the items card */}
                        <div className="px-5 py-4 border-t bg-muted/20 space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount {order.promo_code && `(${order.promo_code})`}</span>
                                    <span>-{fmt(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-muted-foreground">
                                <span>Delivery</span><span>{fmt(order.delivery_charge)}</span>
                            </div>
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span><span>{fmt(order.tax_amount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span><span>{fmt(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping / Customer */}
                    <div className="rounded-lg border">
                        <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-sm">
                                {order.is_pos_order ? "Customer" : "Shipping Address"}
                            </h2>
                        </div>
                        <div className="px-5 py-4 text-sm space-y-1">
                            {order.is_pos_order ? (
                                <>
                                    <p className="font-medium">{order.pos_customer_name}</p>
                                    <p className="text-muted-foreground">{order.pos_customer_phone}</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium">{order.shipping_address?.full_name}</p>
                                    <p className="text-muted-foreground">
                                        {order.shipping_address?.address_line1}
                                        {order.shipping_address?.address_line2 && `, ${order.shipping_address.address_line2}`}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {order.shipping_address?.city}
                                        {order.shipping_address?.district && `, ${order.shipping_address.district}`}
                                    </p>
                                    {order.shipping_address?.phone && (
                                        <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Customer Notes */}
                    {order.customer_notes && (
                        <div className="rounded-lg border">
                            <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center gap-2">
                                <StickyNote className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-semibold text-sm">Customer Notes</h2>
                            </div>
                            <p className="px-5 py-4 text-sm text-muted-foreground">{order.customer_notes}</p>
                        </div>
                    )}
                </div>

                {/* Right — Payment + Status summary */}
                <div className="space-y-5">

                    {/* Payment */}
                    <div className="rounded-lg border">
                        <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-sm">Payment</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge variant={order.payment_status === "PAID" ? "default" : order.payment_status === "FAILED" ? "destructive" : "secondary"}>
                                    {order.payment_status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Method</p>
                                <p className="font-medium uppercase">{order.payment_method}</p>
                            </div>
                            {order.payment_transaction_id && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                                    <p className="font-mono text-xs break-all">{order.payment_transaction_id}</p>
                                </div>
                            )}
                            {order.paid_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Paid At</p>
                                    <p className="font-medium">{fmtDateTimeLong(order.paid_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gift info */}
                    {order.is_gift && (
                        <div className="rounded-lg border px-5 py-4 text-sm space-y-1">
                            <p className="font-semibold">Gift Order</p>
                            {order.gift_message && (
                                <p className="text-muted-foreground italic">"{order.gift_message}"</p>
                            )}
                        </div>
                    )}

                    {/* Status History */}
                    {order.status_history?.length > 0 && (
                        <div className="rounded-lg border">
                            <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center gap-2">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-semibold text-sm">Status History</h2>
                            </div>
                            <div className="px-5 py-4">
                                <ol className="relative border-l border-border space-y-4 ml-2">
                                    {[...order.status_history].reverse().map((entry, i) => (
                                        <li key={i} className="pl-5 relative">
                                            <span className="absolute -left-[9px] top-1 w-[14px] h-[14px] rounded-full border-2 border-background bg-primary ring-1 ring-border" />
                                            <p className="text-xs font-semibold uppercase tracking-wide">{entry.status}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <OrderStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                order={order}
            />
        </div>
    )
}
