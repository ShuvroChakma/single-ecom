import {
  cancelGiftCard,
  createGiftCard,
  GiftCard,
  GiftCardStatus,
  getGiftCards,
} from "@/api/gift-cards"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fmtDateLong } from "@/lib/date"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Loader2, MoreHorizontal, Plus, XCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  status: z.enum(["ACTIVE", "EXHAUSTED", "EXPIRED", "CANCELLED"]).optional(),
})

export const Route = createFileRoute("/dashboard/gift-cards/")({
  validateSearch: searchSchema,
  component: GiftCardsPage,
})

const STATUS_BADGE_CLASS: Record<GiftCardStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  EXHAUSTED: "bg-gray-100 text-gray-700 border-gray-200",
  EXPIRED: "bg-orange-100 text-orange-800 border-orange-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

function StatusBadge({ status }: { status: GiftCardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
    >
      {status}
    </span>
  )
}

interface CreateFormState {
  initial_balance: string
  recipient_name: string
  recipient_email: string
  personal_message: string
  expires_at: string
}

const EMPTY_FORM: CreateFormState = {
  initial_balance: "",
  recipient_name: "",
  recipient_email: "",
  personal_message: "",
  expires_at: "",
}

function GiftCardsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()
  const { page, limit, status } = Route.useSearch()

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM)
  const [cardToCancel, setCardToCancel] = useState<GiftCard | null>(null)

  const pagination = { pageIndex: page - 1, pageSize: limit }

  const { data, isLoading } = useQuery({
    queryKey: ["gift-cards", page, limit, status],
    queryFn: () => getGiftCards({ data: { page, limit, status } }),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const balance = parseFloat(form.initial_balance)
      if (isNaN(balance) || balance <= 0) {
        throw new Error("Initial balance must be a positive number")
      }
      return createGiftCard({
        data: {
          initial_balance: balance,
          recipient_name: form.recipient_name || undefined,
          recipient_email: form.recipient_email || undefined,
          personal_message: form.personal_message || undefined,
          expires_at: form.expires_at || undefined,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] })
      toast.success("Gift card created successfully")
      setCreateOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (e: any) => toast.error(e.message || "Failed to create gift card"),
  })

  const cancelMutation = useMutation({
    mutationFn: (cardId: string) => cancelGiftCard({ data: { cardId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] })
      toast.success("Gift card cancelled")
      setCardToCancel(null)
    },
    onError: (e: any) => toast.error(e.message || "Failed to cancel gift card"),
  })

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM)
    setCreateOpen(true)
  }

  const handleCreate = () => {
    createMutation.mutate()
  }

  const handleConfirmCancel = () => {
    if (cardToCancel) {
      cancelMutation.mutate(cardToCancel.id)
    }
  }

  const columns: ColumnDef<GiftCard>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-semibold tracking-wide text-sm">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const card = row.original
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">
              {card.currency} {card.remaining_balance.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              of {card.currency} {card.initial_balance.toFixed(2)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("status") as GiftCardStatus} />
      ),
    },
    {
      id: "recipient",
      header: "Recipient",
      cell: ({ row }) => {
        const card = row.original
        if (!card.recipient_name && !card.recipient_email) {
          return <span className="text-muted-foreground text-xs">—</span>
        }
        return (
          <div className="flex flex-col text-sm">
            {card.recipient_name && (
              <span className="font-medium">{card.recipient_name}</span>
            )}
            {card.recipient_email && (
              <span className="text-xs text-muted-foreground">
                {card.recipient_email}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "expires_at",
      header: "Expires At",
      cell: ({ row }) => {
        const val = row.getValue("expires_at") as string | null
        return val ? (
          fmtDateLong(val)
        ) : (
          <span className="text-muted-foreground text-xs">Never</span>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => fmtDateLong(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const card = row.original
        const isCancellable = card.status === "ACTIVE"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(card.code)}
              >
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={
                  isCancellable
                    ? "text-red-600 focus:text-red-600"
                    : "opacity-50 cursor-not-allowed"
                }
                disabled={!isCancellable}
                onClick={() => isCancellable && setCardToCancel(card)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Gift Cards</h1>
        <div className="flex flex-wrap gap-2">
          <Select
            value={status || "__all__"}
            onValueChange={(v) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  status:
                    v === "__all__"
                      ? undefined
                      : (v as GiftCardStatus),
                  page: 1,
                }),
                replace: true,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Gift Card
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.success ? data.data.items : []}
        pageCount={data?.success ? data.data.pages : -1}
        rowCount={data?.success ? data.data.total : 0}
        pagination={pagination}
        onPaginationChange={(p) =>
          navigate({
            search: (prev) => ({
              ...prev,
              page: p.pageIndex + 1,
              limit: p.pageSize,
            }),
            replace: true,
          })
        }
        manualPagination
        isLoading={isLoading}
      />

      {/* Create Gift Card Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Gift Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="initial_balance">
                Balance <span className="text-red-500">*</span>
              </Label>
              <Input
                id="initial_balance"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 500"
                value={form.initial_balance}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initial_balance: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient_name">Recipient Name</Label>
              <Input
                id="recipient_name"
                type="text"
                placeholder="John Doe"
                value={form.recipient_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipient_name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient_email">Recipient Email</Label>
              <Input
                id="recipient_email"
                type="email"
                placeholder="john@example.com"
                value={form.recipient_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipient_email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="personal_message">Personal Message</Label>
              <Textarea
                id="personal_message"
                placeholder="Write a personal message..."
                rows={3}
                value={form.personal_message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personal_message: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!cardToCancel}
        onOpenChange={(open) => !open && setCardToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Gift Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel gift card{" "}
              <span className="font-mono font-semibold">{cardToCancel?.code}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              Keep Card
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
