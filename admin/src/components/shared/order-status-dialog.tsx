import { Order, OrderStatus, UpdateOrderStatusPayload, updateOrderStatus } from "@/api/orders"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface OrderStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "RETURNED", label: "Returned" },
]

const fetchStatuses = async (query: string) => {
  const q = query.toLowerCase()
  return ORDER_STATUSES.filter(s => s.label.toLowerCase().includes(q))
}

export function OrderStatusDialog({ open, onOpenChange, order }: OrderStatusDialogProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [notes, setNotes] = useState("")

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: UpdateOrderStatusPayload }) =>
      updateOrderStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["order", order.id] })
      toast.success("Order status updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order status")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      id: order.id,
      payload: {
        status,
        notes: notes || undefined,
      },
    })
  }

  const isPending = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the status for order #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm font-medium">{order.status}</p>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <AsyncCombobox
              value={status}
              onValueChange={(val) => setStatus(val as OrderStatus)}
              fetchOptions={fetchStatuses}
              placeholder="Select status..."
              searchPlaceholder="Search status..."
              initialOption={ORDER_STATUSES.find(s => s.value === status)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || status === order.status}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
