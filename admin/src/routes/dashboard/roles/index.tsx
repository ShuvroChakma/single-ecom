import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, Lock, MoreHorizontal, Plus, Shield } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { RoleListItem, deleteRole, getRoles } from "@/api/roles"
import { DataTable } from "@/components/shared/data-table"
import { RoleDialog } from "@/components/shared/role-dialog"
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

export const Route = createFileRoute("/dashboard/roles/")({
    component: RolesPage,
})

function RolesPage() {
    const queryClient = useQueryClient()
    const [selectedRole, setSelectedRole] = useState<RoleListItem | undefined>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    const { data, isLoading } = useQuery({
        queryKey: ['roles', pagination],
        queryFn: () => getRoles({
            data: {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize
            }
        }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteRole({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            toast.success("Role deleted successfully")
            setRoleToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete role")
        },
    })

    const handleEdit = (role: RoleListItem) => {
        setSelectedRole(role)
        setIsDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedRole(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = (role: RoleListItem) => {
        setRoleToDelete(role)
    }

    const confirmDelete = () => {
        if (roleToDelete) {
            deleteMutation.mutate(roleToDelete.id)
        }
    }

    const columns: ColumnDef<RoleListItem>[] = [
        {
            accessorKey: "name",
            header: "Role Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{row.getValue("name")}</span>
                    {row.original.is_system && (
                        <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => row.original.description || "-",
        },
        {
            accessorKey: "permissions_count",
            header: "Permissions",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.permissions_count} permissions
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
                const role = row.original
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
                            <DropdownMenuItem onClick={() => handleEdit(role)}>
                                {role.is_system ? "View" : "Edit"}
                            </DropdownMenuItem>
                            {!role.is_system && (
                                <DropdownMenuItem
                                    onClick={() => handleDelete(role)}
                                    className="text-destructive"
                                >
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const roles = data?.success ? data.data.items : []
    const totalCount = data?.success ? data.data.total : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground">
                        Manage user roles and permissions
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={roles}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />

            <RoleDialog
                key={selectedRole?.id || 'new-role'}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                role={selectedRole}
            />

            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete role "{roleToDelete?.name}"? This action cannot be undone.
                            Users assigned to this role will lose their permissions.
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
