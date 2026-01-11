import { Metal, MetalPayload, createMetal, updateMetal } from "@/api/metals"
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

interface MetalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metal?: Metal
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function MetalDialog({ open, onOpenChange, metal }: MetalDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!metal

  const createMutation = useMutation({
    mutationFn: (data: MetalPayload) => createMetal({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metals"] })
      toast.success("Metal created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create metal")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { metal: Partial<MetalPayload>; id: string }) =>
      updateMetal({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metals"] })
      toast.success("Metal updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update metal")
    },
  })

  const form = useForm({
    defaultValues: {
      name: metal?.name || "",
      code: metal?.code || "",
      sort_order: metal?.sort_order ?? 0,
      is_active: metal?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: MetalPayload = {
        name: value.name,
        code: value.code,
        sort_order: value.sort_order,
        is_active: value.is_active,
      }

      if (isEditing && metal) {
        await updateMutation.mutateAsync({ metal: payload, id: metal.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("name", metal?.name || "")
      form.setFieldValue("code", metal?.code || "")
      form.setFieldValue("sort_order", metal?.sort_order ?? 0)
      form.setFieldValue("is_active", metal?.is_active ?? true)
    }
  }, [open, metal])

  const isPending = createMutation.isPending || updateMutation.isPending

  // Auto-generate code from name
  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, "_")
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Metal" : "Create Metal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the metal details below."
              : "Fill in the details to create a new metal type."}
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
                  placeholder="e.g., Gold, Silver, Platinum"
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
                  placeholder="e.g., GOLD, SILVER"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Uppercase letters and underscores only
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
