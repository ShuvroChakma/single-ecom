import {
  deletePromoCode,
  DiscountType,
  getPromoCodes,
  PromoCode,
} from "@/api/promo"
import { PromoCodeDialog } from "@/components/shared/promo-code-dialog"
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
import { format, isPast, isFuture } from "date-fns"
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
  Percent,
  DollarSign,
  Truck,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/marketing/promo-codes/")({
  component: PromoCodesPage,
})

function PromoCodesPage() {
  const queryClient = useQueryClient()
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => getPromoCodes(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromoCode({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo code deleted successfully")
      setPromoToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete promo code")
    },
  })

  const handleEdit = (promo: PromoCode) => {
    setSelectedPromoCode(promo)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedPromoCode(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = (promo: PromoCode) => {
    setPromoToDelete(promo)
  }

  const confirmDelete = () => {
    if (promoToDelete) {
      deleteMutation.mutate(promoToDelete.id)
    }
  }

  const getDiscountTypeIcon = (type: DiscountType) => {
    switch (type) {
      case "PERCENTAGE":
        return <Percent className="h-4 w-4" />
      case "FIXED_AMOUNT":
        return <DollarSign className="h-4 w-4" />
      case "FREE_SHIPPING":
        return <Truck className="h-4 w-4" />
    }
  }

  const getDiscountDisplay = (promo: PromoCode) => {
    switch (promo.discount_type) {
      case "PERCENTAGE":
        return `${promo.discount_value}%${promo.max_discount ? ` (max ${promo.max_discount})` : ""}`
      case "FIXED_AMOUNT":
        return `${promo.discount_value}`
      case "FREE_SHIPPING":
        return "Free Shipping"
    }
  }

  const getPromoStatus = (promo: PromoCode) => {
    if (!promo.is_active) return { label: "Inactive", variant: "secondary" as const }
    if (isFuture(new Date(promo.starts_at))) return { label: "Scheduled", variant: "outline" as const }
    if (isPast(new Date(promo.expires_at))) return { label: "Expired", variant: "destructive" as const }
    if (promo.max_total_uses && promo.current_uses >= promo.max_total_uses)
      return { label: "Exhausted", variant: "destructive" as const }
    return { label: "Active", variant: "default" as const }
  }

  const columns: ColumnDef<PromoCode>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold">{row.getValue("code")}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "discount_type",
      header: "Discount",
      cell: ({ row }) => {
        const promo = row.original
        return (
          <div className="flex items-center gap-2">
            {getDiscountTypeIcon(promo.discount_type)}
            <span>{getDiscountDisplay(promo)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "current_uses",
      header: "Usage",
      cell: ({ row }) => {
        const promo = row.original
        return (
          <span>
            {promo.current_uses}
            {promo.max_total_uses ? ` / ${promo.max_total_uses}` : ""}
          </span>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const status = getPromoStatus(row.original)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      accessorKey: "starts_at",
      header: "Valid Period",
      cell: ({ row }) => {
        const promo = row.original
        return (
          <div className="flex flex-col text-xs">
            <span>{format(new Date(promo.starts_at), "PP")}</span>
            <span className="text-muted-foreground">
              to {format(new Date(promo.expires_at), "PP")}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const promo = row.original

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
                onClick={() => navigator.clipboard.writeText(promo.code)}
              >
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(promo)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleDelete(promo)}
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

  const promoCodes = data?.success ? data.data : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Promo Code
        </Button>
      </div>

      <DataTable columns={columns} data={promoCodes} isLoading={isLoading} />

      <PromoCodeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        promoCode={selectedPromoCode}
      />

      <AlertDialog
        open={!!promoToDelete}
        onOpenChange={(open) => !open && setPromoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{promoToDelete?.code}"? This action
              cannot be undone.
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
