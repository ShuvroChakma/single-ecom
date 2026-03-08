import { deleteProduct, getAdminProducts, Product, updateProduct } from "@/api/products"
import { getImageUrl } from "@/lib/utils"
import { DataTable } from "@/components/shared/data-table"
import {
  AlertDialog,
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
import { createFileRoute, Link } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateShort } from "@/lib/date"
import { Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const queryClient = useQueryClient()
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [globalFilter, setGlobalFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["products", pagination, globalFilter],
    queryFn: () =>
      getAdminProducts({
        data: {
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          search: globalFilter || undefined,
        },
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product deleted successfully")
      setProductToDelete(null)
      setDeleteError(null)
    },
    onError: (error: any) => {
      setDeleteError(error.message || "Failed to delete product")
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateProduct({ data: { id, product: { is_active } } }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(vars.is_active ? "Product activated" : "Product deactivated")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product status")
    },
  })

  const confirmDelete = () => {
    if (productToDelete) {
      setDeleteError(null)
      deleteMutation.mutate(productToDelete.id)
    }
  }

  const handleDeactivateAndClose = () => {
    if (productToDelete) {
      toggleActiveMutation.mutate({ id: productToDelete.id, is_active: false })
      setProductToDelete(null)
      setDeleteError(null)
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original
        const firstImage = product.images?.[0]

        return (
          <div className="flex items-center gap-3">
            {firstImage ? (
              <img
                src={getImageUrl(firstImage)}
                alt={product.name}
                className="h-10 w-10 rounded-md object-cover border"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/40x40?text=IMG"
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                IMG
              </div>
            )}
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku_base}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("gender")}</Badge>
      ),
    },
    {
      accessorKey: "variants",
      header: "Variants",
      cell: ({ row }) => {
        const variants = row.original.variants || []
        return (
          <Badge variant="secondary">
            {variants.length} variant{variants.length !== 1 ? "s" : ""}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_featured",
      header: "Featured",
      cell: ({ row }) => {
        const isFeatured = row.getValue("is_featured")
        return isFeatured ? (
          <Badge variant="default">Featured</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
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
      header: "Created",
      cell: ({ row }) => fmtDateShort(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original

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
                onClick={() => navigator.clipboard.writeText(product.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/products/$productId" params={{ productId: product.slug }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/products/$productId/edit" params={{ productId: product.slug }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActiveMutation.mutate({ id: product.id, is_active: !product.is_active })}
              >
                {product.is_active
                  ? <><EyeOff className="mr-2 h-4 w-4" />Deactivate</>
                  : <><Eye className="mr-2 h-4 w-4" />Activate</>
                }
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setProductToDelete(product)}
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

  const products = data?.success ? data.data.items : []
  const totalPages = data?.success ? data.data.pages : 0
  const totalCount = data?.success ? data.data.total : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        pageCount={totalPages}
        rowCount={totalCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        manualPagination={true}
      />

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => { if (!open) { setProductToDelete(null); setDeleteError(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              will also delete all associated variants. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <p className="font-medium mb-1">Cannot delete</p>
              <p>{deleteError}</p>
            </div>
          )}
          <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            {deleteError && productToDelete?.is_active && (
              <Button
                variant="outline"
                onClick={handleDeactivateAndClose}
                disabled={toggleActiveMutation.isPending}
              >
                {toggleActiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate Instead
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
