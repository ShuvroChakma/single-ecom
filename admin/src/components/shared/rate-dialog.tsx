import { searchMetals } from "@/api/metals"
import { RatePayload, addRate } from "@/api/rates"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface RateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function RateDialog({ open, onOpenChange }: RateDialogProps) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: RatePayload) => addRate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates"] })
      toast.success("Rate added successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add rate")
    },
  })

  const form = useForm({
    defaultValues: {
      metal_type: "",
      purity: "",
      rate_per_gram: "",
      currency: "BDT",
      source: "MANUAL" as "MANUAL" | "BAJUS" | "API",
    },
    onSubmit: async ({ value }) => {
      const payload: RatePayload = {
        metal_type: value.metal_type,
        purity: value.purity,
        rate_per_gram: parseFloat(value.rate_per_gram),
        currency: value.currency,
        source: value.source,
      }
      await createMutation.mutateAsync(payload)
    },
  })

  const isPending = createMutation.isPending

  // Async fetch function for metals
  const fetchMetalOptions = async (query: string) => {
    try {
      const result = await searchMetals({ data: { query, limit: 20 } })
      if (result.success) {
        return result.data.map(m => ({
          value: m.code,
          label: `${m.name} (${m.code})`
        }))
      }
      return []
    } catch (error) {
      console.error("Error fetching metals:", error)
      return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Rate</DialogTitle>
          <DialogDescription>
            Add a new daily rate for a metal type and purity.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="metal_type"
            validators={{
              onChange: ({ value }) =>
                !value ? "Metal type is required" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label>Metal Type *</Label>
                <AsyncCombobox
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  fetchOptions={fetchMetalOptions}
                  placeholder="Select metal type"
                  searchPlaceholder="Search metals..."
                  emptyText="No metals found"
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="purity"
            validators={{
              onChange: ({ value }) =>
                !value ? "Purity is required" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="purity">Purity Code *</Label>
                <Input
                  id="purity"
                  placeholder="e.g., 22K, 24K, 18K"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="rate_per_gram"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Rate is required"
                if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
                  return "Rate must be a positive number"
                }
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="rate_per_gram">Rate per Gram (BDT) *</Label>
                <Input
                  id="rate_per_gram"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 8500.00"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="currency"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <form.Field
              name="source"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as "MANUAL" | "BAJUS" | "API")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="BAJUS">BAJUS</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Rate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
