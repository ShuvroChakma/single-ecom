import { Brand, deleteBrand, getBrands } from "@/api/brands"
import { BrandDialog } from "@/components/shared/brand-dialog"
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
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute('/dashboard/products/brands/')({
  component: BrandsPage,
})

function BrandsPage() {
  const queryClient = useQueryClient()
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getBrands(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      toast.success("Brand deleted successfully")
      setBrandToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete brand")
    },
  })

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedBrand(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (brand: Brand) => {
    setBrandToDelete(brand)
  }

  const confirmDelete = () => {
    if (brandToDelete) {
      deleteMutation.mutate(brandToDelete.id)
    }
  }

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.logo && (
            <img
              src={getImageUrl(row.original.logo)}
              alt={row.original.name}
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
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
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const brand = row.original

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
                onClick={() => navigator.clipboard.writeText(brand.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(brand)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDelete(brand)}
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

  const brands = data?.success ? data.data : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={brands}
        isLoading={isLoading}
      />

      <BrandDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        brand={selectedBrand}
      />

      <AlertDialog open={!!brandToDelete} onOpenChange={(open) => !open && setBrandToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{brandToDelete?.name}"? This action cannot be undone.
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
