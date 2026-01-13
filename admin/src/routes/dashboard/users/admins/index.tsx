import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Plus, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Admin, deleteAdmin, getAdmins } from "@/api/admins"
import { AdminDialog } from "@/components/shared/admin-dialog"
import { DataTable } from "@/components/shared/data-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

export const Route = createFileRoute("/dashboard/users/admins/")({
  component: AdminsPage,
})

function AdminsPage() {
  const queryClient = useQueryClient()
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['admins', pagination],
    queryFn: () => getAdmins({
      data: {
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize
      }
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdmin({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
      toast.success("Admin deleted successfully")
      setAdminToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete admin")
    },
  })

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedAdmin(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (admin: Admin) => {
    setAdminToDelete(admin)
  }

  const confirmDelete = () => {
    if (adminToDelete) {
      deleteMutation.mutate(adminToDelete.id)
    }
  }

  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => {
        const isSuperAdmin = row.original.is_super_admin || row.original.role_name === "SUPER_ADMIN"
        return (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-medium">{row.getValue("username")}</span>
            {isSuperAdmin && (
              <Badge variant="destructive" className="text-xs">Super Admin</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role_name",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.role_name || "No Role"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_active") ? "default" : "secondary"}>
          {row.getValue("is_active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const admin = row.original
        // Super admins or users with SUPER_ADMIN role cannot be edited or deleted
        const isProtected = admin.is_super_admin || admin.role_name === "SUPER_ADMIN"
        if (isProtected) {
          return (
            <span className="text-xs text-muted-foreground">Protected</span>
          )
        }
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
              <DropdownMenuItem onClick={() => handleEdit(admin)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(admin)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const admins = data?.success ? data.data.items : []
  const totalCount = data?.success ? data.data.total : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admins</h1>
          <p className="text-muted-foreground">
            Manage admin users and their access
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={Math.ceil(totalCount / pagination.pageSize)}
      />

      <AdminDialog
        key={selectedAdmin?.id || 'new-admin'}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        admin={selectedAdmin}
      />

      <AlertDialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete admin "{adminToDelete?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
