import {
    AttributeGroup,
    AttributeGroupPayload,
    createAttributeGroup,
    updateAttributeGroup
} from "@/api/attributes"
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

interface AttributeGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: AttributeGroup
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function AttributeGroupDialog({ open, onOpenChange, group }: AttributeGroupDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!group

  const createMutation = useMutation({
    mutationFn: (data: AttributeGroupPayload) => createAttributeGroup({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
      toast.success("Attribute group created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create attribute group")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { group: Partial<AttributeGroupPayload>; id: string }) =>
      updateAttributeGroup({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
      toast.success("Attribute group updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attribute group")
    },
  })

  const form = useForm({
    defaultValues: {
      name: group?.name || "",
      sort_order: group?.sort_order || 0,
      is_active: group?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      if (isEditing && group) {
        await updateMutation.mutateAsync({
          group: value,
          id: group.id
        })
      } else {
        await createMutation.mutateAsync(value)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("name", group?.name || "")
      form.setFieldValue("sort_order", group?.sort_order || 0)
      form.setFieldValue("is_active", group?.is_active ?? true)
    }
  }, [open, group])

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Attribute Group" : "Create Attribute Group"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the attribute group details."
              : "Create a new attribute group to organize product attributes."}
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
              onChange: ({ value }) => {
                if (!value) return "Name is required"
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Basic Information"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
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
