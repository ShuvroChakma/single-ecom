import { getInquiries, Inquiry, InquiryStatus, InquiryType, updateInquiry } from "@/api/inquiries"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateLong, fmtDateTimeLong } from "@/lib/date"
import { Loader2, MoreHorizontal, Eye } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  type: z.enum(["CUSTOM_JEWELLERY", "GENERAL", "SUPPORT", "FEEDBACK"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
})

export const Route = createFileRoute("/dashboard/inquiries/")({
  validateSearch: searchSchema,
  component: InquiriesPage,
})

const TYPE_LABELS: Record<InquiryType, string> = {
  CUSTOM_JEWELLERY: "Custom Jewellery",
  GENERAL: "General",
  SUPPORT: "Support",
  FEEDBACK: "Feedback",
}

const STATUS_VARIANTS: Record<InquiryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "destructive",
  IN_PROGRESS: "default",
  RESOLVED: "secondary",
  CLOSED: "outline",
}

function InquiriesPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()
  const { page, limit, type, status } = Route.useSearch()
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [notes, setNotes] = useState("")
  const [newStatus, setNewStatus] = useState<InquiryStatus | "">("")

  const pagination = { pageIndex: page - 1, pageSize: limit }

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", page, limit, type, status],
    queryFn: () => getInquiries({ data: { page, per_page: limit, type, status } }),
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status?: InquiryStatus; admin_notes?: string }) =>
      updateInquiry({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] })
      toast.success("Inquiry updated")
      setSelected(null)
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  })

  const handleView = (inquiry: Inquiry) => {
    setSelected(inquiry)
    setNotes(inquiry.admin_notes || "")
    setNewStatus(inquiry.status)
  }

  const handleSave = () => {
    if (!selected) return
    updateMutation.mutate({
      id: selected.id,
      status: newStatus || undefined,
      admin_notes: notes || undefined,
    })
  }

  const columns: ColumnDef<Inquiry>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{TYPE_LABELS[row.getValue("type") as InquiryType]}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as InquiryStatus
        return <Badge variant={STATUS_VARIANTS[s]}>{s.replace("_", " ")}</Badge>
      },
    },
    {
      accessorKey: "metal_type",
      header: "Metal",
      cell: ({ row }) => row.getValue("metal_type") || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      accessorKey: "budget_range",
      header: "Budget",
      cell: ({ row }) => row.getValue("budget_range") || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
      cell: ({ row }) => fmtDateLong(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const inquiry = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleView(inquiry)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
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
        <h1 className="text-2xl font-bold tracking-tight">Inquiries</h1>
        <div className="flex flex-wrap gap-2">
          <Select
            value={type || "__all__"}
            onValueChange={(v) =>
              navigate({ search: (prev) => ({ ...prev, type: v === "__all__" ? undefined : v as InquiryType, page: 1 }), replace: true })
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || "__all__"}
            onValueChange={(v) =>
              navigate({ search: (prev) => ({ ...prev, status: v === "__all__" ? undefined : v as InquiryStatus, page: 1 }), replace: true })
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.success ? data.data.items : []}
        pageCount={data?.success ? data.data.pages : -1}
        rowCount={data?.success ? data.data.total : 0}
        pagination={pagination}
        onPaginationChange={(p) =>
          navigate({ search: (prev) => ({ ...prev, page: p.pageIndex + 1, limit: p.pageSize }), replace: true })
        }
        manualPagination
        isLoading={isLoading}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.email}</p>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selected.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge variant="outline">{TYPE_LABELS[selected.type]}</Badge>
                </div>
                {selected.metal_type && (
                  <div>
                    <p className="text-muted-foreground">Metal Type</p>
                    <p className="font-medium">{selected.metal_type}</p>
                  </div>
                )}
                {selected.budget_range && (
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">{selected.budget_range}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{fmtDateTimeLong(selected.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Message</p>
                <p className="bg-muted rounded p-3 text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>

              {selected.design_image && (
                <div>
                  <p className="text-muted-foreground mb-1">Design Image</p>
                  <a href={selected.design_image} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    View uploaded image
                  </a>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as InquiryStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes visible only to admins..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
