import { Admin, AdminPayload, AdminUpdatePayload, createAdmin, updateAdmin } from "@/api/admins"
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

interface AdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin?: Admin
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function AdminDialog({ open, onOpenChange, admin }: AdminDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!admin

  const createMutation = useMutation({
    mutationFn: (data: AdminPayload) => createAdmin({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
      toast.success("Admin created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create admin")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { admin: AdminUpdatePayload; id: string }) =>
      updateAdmin({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
      toast.success("Admin updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update admin")
    },
  })

  const form = useForm({
    defaultValues: {
      email: admin?.email || "",
      username: admin?.username || "",
      password: "",
      is_active: admin?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      if (isEditing && admin) {
        const updateData: AdminUpdatePayload = {
          email: value.email,
          username: value.username,
          is_active: value.is_active,
        }
        if (value.password) {
          updateData.password = value.password
        }
        await updateMutation.mutateAsync({ admin: updateData, id: admin.id })
      } else {
        const createData: AdminPayload = {
          email: value.email,
          username: value.username,
          password: value.password,
        }
        await createMutation.mutateAsync(createData)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("email", admin?.email || "")
      form.setFieldValue("username", admin?.username || "")
      form.setFieldValue("password", "")
      form.setFieldValue("is_active", admin?.is_active ?? true)
    }
  }, [open, admin])

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Admin" : "Create Admin"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the admin details below."
              : "Fill in the details to create a new admin user."}
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
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Email is required"
                if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email format"
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Username is required"
                if (value.length < 3) return "Username must be at least 3 characters"
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!isEditing && !value) return "Password is required"
                if (value && value.length < 8) return "Password must be at least 8 characters"
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {isEditing ? "(leave blank to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          {isEditing && (
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
          )}

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
