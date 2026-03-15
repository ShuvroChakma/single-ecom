import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateTime } from "@/lib/date"
import { Eye, MoreHorizontal, Package, RefreshCw } from "lucide-react"
import { useState } from "react"

import { OrderListItem, OrderStatus, getOrders } from "@/api/orders"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function OrdersPage() {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

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
                const variant = ["CANCELLED", "REFUNDED"].includes(status) ? "destructive" : ["PENDING", "RETURNED"].includes(status) ? "secondary" : "default"
                return <Badge variant={variant}>{status}</Badge>
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
            cell: ({ row }) => fmtDateTime(row.getValue("created_at")),
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
                            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/orders/$orderId", params: { orderId: order.id } })}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage customer orders and fulfillment
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus | "ALL")}>
                        <SelectTrigger className="w-full sm:w-[180px]">
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
                manualPagination={true}
            />

        </div>
    )
}
