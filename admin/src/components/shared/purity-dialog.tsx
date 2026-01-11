import { Purity, PurityPayload, createPurity, searchMetals, updatePurity } from "@/api/metals"
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
import { Switch } from "@/components/ui/switch"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"

interface PurityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purity?: Purity & { metal_id?: string }
  defaultMetalId?: string
  // Optional initial metal for display when editing
  initialMetalLabel?: string
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function PurityDialog({ open, onOpenChange, purity, defaultMetalId, initialMetalLabel }: PurityDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!purity

  const createMutation = useMutation({
    mutationFn: (data: PurityPayload) => createPurity({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metals"] })
      toast.success("Purity created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create purity")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { purity: Partial<PurityPayload>; id: string }) =>
      updatePurity({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metals"] })
      toast.success("Purity updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update purity")
    },
  })

  const form = useForm({
    defaultValues: {
      metal_id: purity?.metal_id || defaultMetalId || "",
      name: purity?.name || "",
      code: purity?.code || "",
      fineness: purity?.fineness ?? 0.916,
      sort_order: purity?.sort_order ?? 0,
      is_active: purity?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: PurityPayload = {
        metal_id: value.metal_id,
        name: value.name,
        code: value.code,
        fineness: value.fineness,
        sort_order: value.sort_order,
        is_active: value.is_active,
      }

      if (isEditing && purity) {
        await updateMutation.mutateAsync({ purity: payload, id: purity.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("metal_id", purity?.metal_id || defaultMetalId || "")
      form.setFieldValue("name", purity?.name || "")
      form.setFieldValue("code", purity?.code || "")
      form.setFieldValue("fineness", purity?.fineness ?? 0.916)
      form.setFieldValue("sort_order", purity?.sort_order ?? 0)
      form.setFieldValue("is_active", purity?.is_active ?? true)
    }
  }, [open, purity, defaultMetalId])

  const isPending = createMutation.isPending || updateMutation.isPending

  // Auto-generate code from name
  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "")
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Purity" : "Create Purity"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the purity details below."
              : "Fill in the details to create a new purity level."}
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
            name="metal_id"
            validators={{
              onChange: ({ value }) =>
                !value ? "Metal is required" : undefined,
            }}
            children={(field) => {
              // Async fetch function for metals
              const fetchMetalOptions = async (query: string) => {
                try {
                  const result = await searchMetals({ data: { query, limit: 20 } })
                  if (result.success) {
                    return result.data.map(m => ({
                      value: m.id,
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
                <div className="space-y-2">
                  <Label>Metal *</Label>
                  <AsyncCombobox
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    fetchOptions={fetchMetalOptions}
                    placeholder="Select a metal"
                    searchPlaceholder="Search metals..."
                    emptyText="No metals found"
                    initialOption={initialMetalLabel ? { value: field.state.value, label: initialMetalLabel } : undefined}
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          />

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value ? "Name is required" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 22K, 18K, 24K"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    if (!isEditing) {
                      form.setFieldValue("code", generateCode(e.target.value))
                    }
                  }}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) =>
                !value ? "Code is required" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., 22K, 18K"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="fineness"
            validators={{
              onChange: ({ value }) =>
                value < 0 || value > 1 ? "Fineness must be between 0 and 1" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="fineness">Fineness *</Label>
                <Input
                  id="fineness"
                  type="number"
                  step="0.001"
                  min={0}
                  max={1}
                  placeholder="e.g., 0.916 for 22K"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Value between 0 and 1 (e.g., 0.916 for 22K Gold)
                </p>
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="sort_order"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                />
              </div>
            )}
          />

          <form.Field
            name="is_active"
            children={(field) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </div>
            )}
          />

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
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
