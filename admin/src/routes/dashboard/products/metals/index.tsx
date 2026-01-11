import { Metal, Purity, deleteMetal, deletePurity, getMetals } from "@/api/metals"
import { DataTable } from "@/components/shared/data-table"
import { MetalDialog } from "@/components/shared/metal-dialog"
import { PurityDialog } from "@/components/shared/purity-dialog"
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

    // Purity state
    const [selectedPurity, setSelectedPurity] = useState<(Purity & { metal_id?: string }) | undefined>()
    const [isPurityDialogOpen, setIsPurityDialogOpen] = useState(false)
    const [purityToDelete, setPurityToDelete] = useState<Purity | null>(null)
    const [defaultMetalId, setDefaultMetalId] = useState<string | undefined>()

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

    // Purity mutations and handlers
    const deletePurityMutation = useMutation({
        mutationFn: (id: string) => deletePurity({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["metals"] })
            toast.success("Purity deleted successfully")
            setPurityToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete purity")
        },
    })

    const handleAddPurity = (metalId: string) => {
        setSelectedPurity(undefined)
        setDefaultMetalId(metalId)
        setIsPurityDialogOpen(true)
    }

    const handleEditPurity = (purity: Purity, metalId: string) => {
        setSelectedPurity({ ...purity, metal_id: metalId })
        setDefaultMetalId(metalId)
        setIsPurityDialogOpen(true)
    }

    const handleDeletePurity = (purity: Purity) => {
        setPurityToDelete(purity)
    }

    const confirmDeletePurity = () => {
        if (purityToDelete) {
            deletePurityMutation.mutate(purityToDelete.id)
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
                const metal = row.original
                const purities = metal.purities || []
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-wrap">
                            {purities.length > 0 ? (
                                purities.map((p) => (
                                    <Badge
                                        key={p.id}
                                        variant="outline"
                                        className="text-xs cursor-pointer hover:bg-muted"
                                        onClick={() => handleEditPurity(p, metal.id)}
                                    >
                                        {p.name} ({(p.fineness * 100).toFixed(1)}%)
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-muted-foreground text-sm">No purities</span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleAddPurity(metal.id)}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
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

            {/* Purity Dialog */}
            <PurityDialog
                open={isPurityDialogOpen}
                onOpenChange={setIsPurityDialogOpen}
                purity={selectedPurity}
                metals={metals}
                defaultMetalId={defaultMetalId}
            />

            {/* Purity Delete Confirmation */}
            <AlertDialog open={!!purityToDelete} onOpenChange={(open) => !open && setPurityToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Purity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete purity "{purityToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePurityMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeletePurity}
                            disabled={deletePurityMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePurityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
