import { deleteProduct, getAdminProducts, Product } from "@/api/products"
import { getImageUrl } from "@/lib/utils"
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
import { createFileRoute, Link } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Loader2, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const queryClient = useQueryClient()
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
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
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete product")
    },
  })

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id)
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
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PP"),
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
        onOpenChange={(open) => !open && setProductToDelete(null)}
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
