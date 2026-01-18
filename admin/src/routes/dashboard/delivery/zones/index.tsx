import { DeliveryZone, deleteDeliveryZone, getDeliveryZones } from "@/api/delivery"
import { DeliveryZoneDialog } from "@/components/shared/delivery-zone-dialog"
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

export const Route = createFileRoute("/dashboard/delivery/zones/")({
  component: DeliveryZonesPage,
})

function DeliveryZonesPage() {
  const queryClient = useQueryClient()
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<DeliveryZone | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: () => getDeliveryZones(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDeliveryZone({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast.success("Delivery zone deleted successfully")
      setZoneToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete delivery zone")
    },
  })

  const handleEdit = (zone: DeliveryZone) => {
    setSelectedZone(zone)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedZone(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (zone: DeliveryZone) => {
    setZoneToDelete(zone)
  }

  const confirmDelete = () => {
    if (zoneToDelete) {
      deleteMutation.mutate(zoneToDelete.id)
    }
  }

  const formatCharge = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const columns: ColumnDef<DeliveryZone>[] = [
    {
      accessorKey: "name",
      header: "Zone Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "districts",
      header: "Districts",
      cell: ({ row }) => {
        const districts = row.getValue("districts") as string[]
        if (districts.length === 0) {
          return <span className="text-muted-foreground">No districts</span>
        }
        if (districts.includes("*")) {
          return <Badge variant="secondary">All Districts</Badge>
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {districts.slice(0, 3).map((district) => (
              <Badge key={district} variant="outline" className="text-xs">
                {district}
              </Badge>
            ))}
            {districts.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{districts.length - 3} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "charge_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("charge_type") as string
        return (
          <Badge variant={type === "FIXED" ? "default" : "secondary"}>
            {type === "FIXED" ? "Fixed" : "Weight Based"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "base_charge",
      header: "Base Charge",
      cell: ({ row }) => formatCharge(row.getValue("base_charge")),
    },
    {
      id: "delivery_time",
      header: "Est. Days",
      cell: ({ row }) => {
        const zone = row.original
        return `${zone.min_days}-${zone.max_days} days`
      },
    },
    {
      accessorKey: "free_above",
      header: "Free Above",
      cell: ({ row }) => {
        const amount = row.getValue("free_above") as number | null
        return amount ? formatCharge(amount) : "-"
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
        const zone = row.original

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
                onClick={() => navigator.clipboard.writeText(zone.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(zone)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDelete(zone)}
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

  const zones = data?.success ? data.data : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Delivery Zones</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Zone
        </Button>
      </div>

      <DataTable columns={columns} data={zones} isLoading={isLoading} />

      <DeliveryZoneDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        zone={selectedZone}
      />

      <AlertDialog
        open={!!zoneToDelete}
        onOpenChange={(open) => !open && setZoneToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{zoneToDelete?.name}"? This
              action cannot be undone.
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
