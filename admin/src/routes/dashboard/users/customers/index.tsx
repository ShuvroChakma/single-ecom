import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Plus, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Customer, deleteCustomer, getCustomers } from "@/api/customers"
import { CustomerDialog } from "@/components/shared/customer-dialog"
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

export const Route = createFileRoute("/dashboard/users/customers/")({
    component: CustomersPage,
})

function CustomersPage() {
    const queryClient = useQueryClient()
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

    const { data, isLoading } = useQuery({
        queryKey: ['customers', pagination],
        queryFn: () => getCustomers({ 
            data: { 
                skip: pagination.pageIndex * pagination.pageSize,
                limit: pagination.pageSize 
            } 
        }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCustomer({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success("Customer deleted successfully")
            setCustomerToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete customer")
        },
    })

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setIsDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedCustomer(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer)
    }

    const confirmDelete = () => {
        if (customerToDelete) {
            deleteMutation.mutate(customerToDelete.id)
        }
    }

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: "first_name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone_number",
            header: "Phone",
            cell: ({ row }) => row.getValue("phone_number") || "-",
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
            accessorKey: "is_verified",
            header: "Verified",
            cell: ({ row }) => (
                <Badge variant={row.getValue("is_verified") ? "outline" : "secondary"}>
                    {row.getValue("is_verified") ? "Verified" : "Unverified"}
                </Badge>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Joined",
            cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy"),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const customer = row.original
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
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDelete(customer)}
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

    const customers = data?.success ? data.data.items : []
    const totalCount = data?.success ? data.data.total : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage customer accounts and profiles
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={customers}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />

            <CustomerDialog
                key={selectedCustomer?.id || 'new-customer'}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
            />

            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete customer "{customerToDelete?.first_name} {customerToDelete?.last_name}"? This action cannot be undone.
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
