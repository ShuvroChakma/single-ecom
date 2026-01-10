

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* =======================
   TYPES
======================= */

export type Order = {
  id: string
  customer: string
  email: string
  date: string
  total: number
  paymentStatus: "Paid" | "Pending" | "Failed"
  orderStatus: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
}

/* =======================
   MOCK DATA
======================= */

const initialOrders: Order[] = [
  {
    id: "ORD-1001",
    customer: "Rahim Uddin",
    email: "rahim@gmail.com",
    date: "2026-01-02",
    total: 125000,
    paymentStatus: "Paid",
    orderStatus: "Processing",
  },
  {
    id: "ORD-1002",
    customer: "Karim Khan",
    email: "karim@gmail.com",
    date: "2026-01-01",
    total: 89000,
    paymentStatus: "Pending",
    orderStatus: "Pending",
  },
]

/* =======================
   COMPONENT
======================= */

export default function OrderTable() {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"view" | "edit">("view")
  const [selectedOrder, setSelectedOrder] =
    React.useState<Order | null>(null)

  const [status, setStatus] =
    React.useState<Order["orderStatus"]>("Pending")

  /* =======================
     COLUMNS
  ======================= */

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("customer")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">
          ৳{row.getValue<number>("total").toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as string
        return (
          <Badge
            variant={
              status === "Paid"
                ? "default"
                : status === "Pending"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "orderStatus",
      header: "Order Status",
      cell: ({ row }) => {
        const status = row.getValue("orderStatus") as string
        return (
          <Badge
            variant={
              status === "Delivered"
                ? "default"
                : status === "Cancelled"
                ? "destructive"
                : "outline"
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(order)
                  setMode("view")
                  setOpen(true)
                }}
              >
                View
              </DropdownMenuItem>

              {order.orderStatus !== "Delivered" &&
                order.orderStatus !== "Cancelled" && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedOrder(order)
                      setStatus(order.orderStatus)
                      setMode("edit")
                      setOpen(true)
                    }}
                  >
                    Update Status
                  </DropdownMenuItem>
                )}

              {order.orderStatus !== "Delivered" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === order.id
                          ? { ...o, orderStatus: "Cancelled" }
                          : o
                      )
                    )
                  }
                >
                  Cancel Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  /* =======================
     SUBMIT
  ======================= */

  const updateStatus = () => {
    if (!selectedOrder) return

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, orderStatus: status }
          : o
      )
    )

    setOpen(false)
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "view" ? "Order Details" : "Update Order Status"}
            </DialogTitle>
          </DialogHeader>

          {mode === "view" && selectedOrder && (
            <div className="space-y-2 text-sm">
              <p><strong>Order:</strong> {selectedOrder.id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customer}</p>
              <p><strong>Email:</strong> {selectedOrder.email}</p>
              <p><strong>Total:</strong> ৳{selectedOrder.total}</p>
              <p><strong>Payment:</strong> {selectedOrder.paymentStatus}</p>
              <p><strong>Status:</strong> {selectedOrder.orderStatus}</p>
            </div>
          )}

          {mode === "edit" && (
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {mode === "edit" && (
              <Button onClick={updateStatus}>Update</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
