

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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

export type AdminUser = {
  id: string
  name: string
  email: string
  role: "Super Admin" | "Admin"
  status: "Active" | "Disabled"
  lastLogin: string
}

type AdminForm = {
  name: string
  email: string
  role: "Super Admin" | "Admin"
}

/* =======================
   MOCK DATA
======================= */

const initialAdmins: AdminUser[] = [
  {
    id: "1",
    name: "Owner Account",
    email: "owner@goldshop.com",
    role: "Super Admin",
    status: "Active",
    lastLogin: "2026-01-02",
  },
  {
    id: "2",
    name: "Store Manager",
    email: "manager@goldshop.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2026-01-01",
  },
]

/* =======================
   COMPONENT
======================= */

export default function AdminTable() {
  const [admins, setAdmins] = React.useState<AdminUser[]>(initialAdmins)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"add" | "view" | "edit">("add")
  const [selectedAdmin, setSelectedAdmin] =
    React.useState<AdminUser | null>(null)

  const [form, setForm] = React.useState<AdminForm>({
    name: "",
    email: "",
    role: "Admin",
  })

  /* =======================
     COLUMNS
  ======================= */

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant={role === "Super Admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "Active" ? "outline" : "destructive"}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const admin = row.original

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
                  setSelectedAdmin(admin)
                  setMode("view")
                  setOpen(true)
                }}
              >
                View
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setSelectedAdmin(admin)
                  setForm({
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                  })
                  setMode("edit")
                  setOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>

              {admin.role !== "Super Admin" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    setAdmins((prev) =>
                      prev.map((a) =>
                        a.id === admin.id
                          ? {
                              ...a,
                              status:
                                a.status === "Active"
                                  ? "Disabled"
                                  : "Active",
                            }
                          : a
                      )
                    )
                  }
                >
                  {admin.status === "Active" ? "Disable" : "Enable"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: admins,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = () => {
    if (mode === "add") {
      setAdmins((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: form.name,
          email: form.email,
          role: form.role,
          status: "Active",
          lastLogin: "—",
        },
      ])
    }

    if (mode === "edit" && selectedAdmin) {
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === selectedAdmin.id
            ? { ...a, ...form }
            : a
        )
      )
    }

    setOpen(false)
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search admin..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <Button
          onClick={() => {
            setMode("add")
            setForm({ name: "", email: "", role: "Admin" })
            setOpen(true)
          }}
        >
          Add Admin
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                  No admins found.
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
              {mode === "add"
                ? "Add Admin"
                : mode === "edit"
                ? "Edit Admin"
                : "Admin Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Name"
              disabled={mode === "view"}
              value={mode === "view" ? selectedAdmin?.name : form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              disabled={mode === "view"}
              value={mode === "view" ? selectedAdmin?.email : form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <Select
              disabled={mode === "view"}
              value={mode === "view" ? selectedAdmin?.role : form.role}
              onValueChange={(v) =>
                setForm({ ...form, role: v as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {mode !== "view" && (
              <Button onClick={handleSubmit}>
                {mode === "add" ? "Create" : "Update"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
