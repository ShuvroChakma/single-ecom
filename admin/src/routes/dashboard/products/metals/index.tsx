import { Metal, deleteMetal, getMetals } from "@/api/metals"
import { DataTable } from "@/components/shared/data-table"
import { MetalDialog } from "@/components/shared/metal-dialog"
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute('/dashboard/products/metals/')({
    component: MetalsPage,
})

function MetalsPage() {
    const queryClient = useQueryClient()
    const [selectedMetal, setSelectedMetal] = useState<Metal | undefined>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [metalToDelete, setMetalToDelete] = useState<Metal | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['metals'],
        queryFn: () => getMetals(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteMetal({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["metals"] })
            toast.success("Metal deleted successfully")
            setMetalToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete metal")
        },
    })

    const handleEdit = (metal: Metal) => {
        setSelectedMetal(metal)
        setIsDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedMetal(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = (metal: Metal) => {
        setMetalToDelete(metal)
    }

    const confirmDelete = () => {
        if (metalToDelete) {
            deleteMutation.mutate(metalToDelete.id)
        }
    }

    const columns: ColumnDef<Metal>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue("name")}</span>
            ),
        },
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => (
                <code className="rounded bg-muted px-2 py-1 text-sm">
                    {row.getValue("code")}
                </code>
            ),
        },
        {
            accessorKey: "purities",
            header: "Purities",
            cell: ({ row }) => {
                const purities = row.original.purities || []
                return (
                    <div className="flex gap-1 flex-wrap">
                        {purities.length > 0 ? (
                            purities.slice(0, 3).map((p) => (
                                <Badge key={p.id} variant="outline" className="text-xs">
                                    {p.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-sm">No purities</span>
                        )}
                        {purities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                                +{purities.length - 3}
                            </Badge>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "sort_order",
            header: "Order",
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active")
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP"),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const metal = row.original

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
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(metal.id)}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(metal)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(metal)}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const metals = data?.success ? data.data : []

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Metals</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Metal
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={metals}
                isLoading={isLoading}
            />

            <MetalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                metal={selectedMetal}
            />

            <AlertDialog open={!!metalToDelete} onOpenChange={(open) => !open && setMetalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Metal</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{metalToDelete?.name}"? This action cannot be undone.
                            {metalToDelete?.purities && metalToDelete.purities.length > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Warning: This metal has {metalToDelete.purities.length} purities that will also be affected.
                                </span>
                            )}
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
