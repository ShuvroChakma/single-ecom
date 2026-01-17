import { Collection, deleteCollection, getCollections } from "@/api/collections"
import { CollectionDialog } from "@/components/shared/collection-dialog"
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

export const Route = createFileRoute('/dashboard/products/collections/')({
  component: CollectionsPage,
})

function CollectionsPage() {
  const queryClient = useQueryClient()
  const [selectedCollection, setSelectedCollection] = useState<Collection | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCollection({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection deleted successfully")
      setCollectionToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete collection")
    },
  })

  const handleEdit = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedCollection(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (collection: Collection) => {
    setCollectionToDelete(collection)
  }

  const confirmDelete = () => {
    if (collectionToDelete) {
      deleteMutation.mutate(collectionToDelete.id)
    }
  }

  const columns: ColumnDef<Collection>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.banner_image && (
            <img
              src={getImageUrl(row.original.banner_image)}
              alt={row.original.name}
              className="h-10 w-16 rounded object-cover"
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
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
        const collection = row.original

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
                onClick={() => navigator.clipboard.writeText(collection.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(collection)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDelete(collection)}
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

  const collections = data?.success ? data.data : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={collections}
        isLoading={isLoading}
      />

      <CollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        collection={selectedCollection}
      />

      <AlertDialog open={!!collectionToDelete} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone.
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
