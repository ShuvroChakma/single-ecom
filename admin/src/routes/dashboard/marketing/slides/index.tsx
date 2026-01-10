import { deleteSlide, getSlides, Slide, SlideType } from "@/api/slides"
import { DataTable } from "@/components/shared/data-table"
import { SlideDialog } from "@/components/shared/slide-dialog"
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
import { z } from "zod"

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
})

export const Route = createFileRoute('/dashboard/marketing/slides/')({
  validateSearch: searchSchema,
  component: SlidesPage,
})

function SlidesPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()
  const { page, limit, search, sort_by, sort_order } = Route.useSearch()
  const [selectedSlide, setSelectedSlide] = useState<Slide | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<Slide | null>(null)

  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: limit,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['slides', pagination.pageIndex, pagination.pageSize, search, sort_by, sort_order],
    queryFn: () => getSlides({
      data: {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
        include_inactive: true
      }
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSlide({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slides"] })
      toast.success("Slide deleted successfully")
      setSlideToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete slide")
    },
  })

  const handleEdit = (slide: Slide) => {
    setSelectedSlide(slide)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedSlide(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (slide: Slide) => {
    setSlideToDelete(slide)
  }

  const confirmDelete = () => {
    if (slideToDelete) {
      deleteMutation.mutate(slideToDelete.id)
    }
  }

  const getTypeVariant = (type: SlideType) => {
    switch (type) {
      case "BANNER": return "default"
      case "PROMO": return "secondary"
      case "OFFER": return "destructive"
      case "COLLECTION": return "outline"
      default: return "default"
    }
  }

  const columns: ColumnDef<Slide>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("title")}</span>
          {row.original.subtitle && (
            <span className="text-sm text-muted-foreground">{row.original.subtitle}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "slide_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("slide_type") as SlideType
        return <Badge variant={getTypeVariant(type)}>{type}</Badge>
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
      accessorKey: "sort_order",
      header: "Order",
      cell: ({ row }) => <span>{row.getValue("sort_order")}</span>,
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const slide = row.original

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
                onClick={() => navigator.clipboard.writeText(slide.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(slide)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDelete(slide)}
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
        <h1 className="text-2xl font-bold tracking-tight">Slides</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Slide
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

      <SlideDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        slide={selectedSlide}
      />

      <AlertDialog open={!!slideToDelete} onOpenChange={(open) => !open && setSlideToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{slideToDelete?.title}"? This action cannot be undone.
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
