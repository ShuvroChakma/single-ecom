"use client"

import * as React from "react"
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
import { MoreHorizontal } from "lucide-react"

/* =======================
   TYPES
======================= */

export type User = {
  id: string
  name: string
  email: string
  phone: string
  membership: "Gold" | "Silver" | "None"
  totalOrders: number
  totalSpend: number
  status: "Active" | "Blocked"
  joinedAt: string
}

/* =======================
   MOCK DATA (replace with API)
======================= */

const users: User[] = [
  {
    id: "1",
    name: "Rahim Ahmed",
    email: "rahim@gmail.com",
    phone: "+880 17XXXXXXX",
    membership: "Gold",
    totalOrders: 12,
    totalSpend: 285000,
    status: "Active",
    joinedAt: "2025-10-12",
  },
  {
    id: "2",
    name: "Sadia Islam",
    email: "sadia@gmail.com",
    phone: "+880 18XXXXXXX",
    membership: "None",
    totalOrders: 2,
    totalSpend: 42000,
    status: "Blocked",
    joinedAt: "2025-12-01",
  },
]

/* =======================
   COLUMNS
======================= */

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground space-y-1">
        <div>{row.getValue("email")}</div>
        <div>{row.original.phone}</div>
      </div>
    ),
  },
  {
    accessorKey: "membership",
    header: "Membership",
    cell: ({ row }) => {
      const membership = row.getValue("membership") as string

      if (membership === "None") {
        return <span className="text-muted-foreground">—</span>
      }

      return (
        <Badge variant={membership === "Gold" ? "default" : "secondary"}>
          {membership}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalOrders",
    header: "Orders",
  },
  {
    accessorKey: "totalSpend",
    header: "Total Spend",
    cell: ({ row }) => (
      <div className="font-medium">
        ৳{row.getValue<number>("totalSpend").toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === "Active" ? "outline" : "destructive"}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            {user.status === "Active" ? (
              <DropdownMenuItem className="text-destructive">
                Block User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>Unblock User</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

/* =======================
   COMPONENT
======================= */

export default function UserTable() {
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search customer..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
