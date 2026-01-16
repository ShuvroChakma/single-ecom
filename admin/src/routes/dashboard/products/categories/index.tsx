


import { Category, deleteCategory, getCategories } from "@/api/categories"
import { CategoryDialog } from "@/components/shared/create-category-dialog"
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ColumnDef, SortingState } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from 'zod'

const searchSchema = z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
    search: z.string().optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
})

export const Route = createFileRoute('/dashboard/products/categories/')({
    validateSearch: searchSchema,
    component: CategoriesPage,
})

function CategoriesPage() {
    const navigate = useNavigate({ from: Route.fullPath })
    const queryClient = useQueryClient()
    const { page, limit, search, sort_by, sort_order } = Route.useSearch()
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

    const [pagination, setPagination] = useState({
        pageIndex: page - 1,
        pageSize: limit,
    })

    const { data, isLoading } = useQuery({
        queryKey: ['categories', pagination.pageIndex, pagination.pageSize, search, sort_by, sort_order],
        queryFn: () => getCategories({
            data: {
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search,
                sort_by,
                sort_order,
            }
        }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCategory({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-tree"] })
            toast.success("Category deleted successfully")
            setCategoryToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete category")
        },
    })

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setIsDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedCategory(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = (category: Category) => {
        setCategoryToDelete(category)
    }

    const confirmDelete = () => {
        if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id)
        }
    }

    // Columns definition
    const columns: ColumnDef<Category>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "slug",
            header: "Slug",
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
            cell: ({ row }) => {
                return format(new Date(row.getValue("created_at")), "PPP")
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const category = row.original

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
                                onClick={() => navigator.clipboard.writeText(category.id)}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(category)}
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

    const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
        setPagination(newPagination)
        navigate({
            search: (prev) => ({
                ...prev,
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize,
            }),
            replace: true,
        })
    }

    const handleSortingChange = (sorting: SortingState) => {
        const sort = sorting[0]
        navigate({
            search: (prev) => ({
                ...prev,
                sort_by: sort ? sort.id : undefined,
                sort_order: sort ? (sort.desc ? "desc" : "asc") : undefined,
            }),
            replace: true,
        })
    }

    const handleSearchChange = (value: string) => {
        navigate({
            search: (prev) => ({
                ...prev,
                search: value || undefined,
                page: 1,
            }),
            replace: true,
        })
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data?.success ? data.data.items : []}
                pageCount={data?.success ? data.data.pages : -1}
                rowCount={data?.success ? data.data.total : 0}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                onGlobalFilterChange={handleSearchChange}
                globalFilter={search}
                isLoading={isLoading}
            />

            <CategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                category={selectedCategory}
            />

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
                            {categoryToDelete?.subcategories && categoryToDelete.subcategories.length > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Warning: This category has subcategories that will also be affected.
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
