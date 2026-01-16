import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, MoreHorizontal, Package, RefreshCw } from "lucide-react"
import { useState } from "react"

import { Order, OrderListItem, OrderStatus, getOrder, getOrders } from "@/api/orders"
import { DataTable } from "@/components/shared/data-table"
import { OrderStatusDialog } from "@/components/shared/order-status-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/dashboard/orders/")({
    component: OrdersPage,
})

const statusColors: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    CONFIRMED: "default",
    PROCESSING: "default",
    SHIPPED: "default",
    DELIVERED: "default",
    CANCELLED: "destructive",
    REFUNDED: "destructive",
    RETURNED: "secondary",
}

function OrdersPage() {
    const queryClient = useQueryClient()
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['orders', statusFilter, pagination],
        queryFn: () => getOrders({ 
            data: { 
                status: statusFilter === "ALL" ? undefined : statusFilter,
                limit: pagination.pageSize,
                offset: pagination.pageIndex * pagination.pageSize
            } 
        }),
    })

    const handleViewOrder = async (orderId: string) => {
        try {
            const result = await getOrder({ data: { id: orderId } })
            if (result.success) {
                setSelectedOrder(result.data)
                setIsViewDialogOpen(true)
            }
        } catch (error) {
            console.error("Failed to fetch order:", error)
        }
    }

    const handleUpdateStatus = async (orderId: string) => {
        try {
            const result = await getOrder({ data: { id: orderId } })
            if (result.success) {
                setSelectedOrder(result.data)
                setIsStatusDialogOpen(true)
            }
        } catch (error) {
            console.error("Failed to fetch order:", error)
        }
    }

    const columns: ColumnDef<OrderListItem>[] = [
        {
            accessorKey: "order_number",
            header: "Order #",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-medium">{row.getValue("order_number")}</span>
                </div>
            ),
        },
        {
            accessorKey: "item_count",
            header: "Items",
            cell: ({ row }) => (
                <span>{row.getValue("item_count")} items</span>
            ),
        },
        {
            accessorKey: "total",
            header: "Total",
            cell: ({ row }) => {
                const total = parseFloat(row.getValue("total"))
                return (
                    <span className="font-semibold">
                        ৳{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Order Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as OrderStatus
                return (
                    <Badge variant={statusColors[status] || "secondary"}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "payment_status",
            header: "Payment",
            cell: ({ row }) => {
                const status = row.getValue("payment_status") as string
                const variant = status === "PAID" ? "default" : status === "PENDING" ? "secondary" : "destructive"
                return <Badge variant={variant}>{status}</Badge>
            },
        },
        {
            accessorKey: "created_at",
            header: "Date",
            cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy HH:mm"),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id)}>
                                Update Status
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const orders = data?.success ? data.data : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage customer orders and fulfillment
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus | "ALL")}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Orders</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={orders}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
            />

            {/* Order Status Dialog */}
            {selectedOrder && (
                <OrderStatusDialog
                    open={isStatusDialogOpen}
                    onOpenChange={setIsStatusDialogOpen}
                    order={selectedOrder}
                />
            )}

            {/* Order Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment</p>
                                    <Badge variant={selectedOrder.payment_status === "PAID" ? "default" : "secondary"}>
                                        {selectedOrder.payment_status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{format(new Date(selectedOrder.created_at), "PPP p")}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-medium">{selectedOrder.payment_method}</p>
                                </div>
                            </div>

                            {/* POS Customer or Address */}
                            {selectedOrder.is_pos_order ? (
                                <div>
                                    <h3 className="font-semibold mb-2">Customer</h3>
                                    <p>{selectedOrder.pos_customer_name}</p>
                                    <p className="text-muted-foreground">{selectedOrder.pos_customer_phone}</p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                                    <p>{selectedOrder.shipping_address?.full_name}</p>
                                    <p className="text-muted-foreground">
                                        {selectedOrder.shipping_address?.address_line1}
                                        {selectedOrder.shipping_address?.address_line2 && `, ${selectedOrder.shipping_address.address_line2}`}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.district}
                                    </p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-2">Items</h3>
                                <div className="border rounded-lg divide-y">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="p-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.product_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    SKU: {item.variant_sku} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-semibold">৳{parseFloat(String(item.line_total)).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>৳{parseFloat(String(selectedOrder.subtotal)).toLocaleString()}</span>
                                </div>
                                {selectedOrder.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-৳{parseFloat(String(selectedOrder.discount_amount)).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery</span>
                                    <span>৳{parseFloat(String(selectedOrder.delivery_charge)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total</span>
                                    <span>৳{parseFloat(String(selectedOrder.total)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
