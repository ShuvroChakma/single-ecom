import { Customer, CustomerPayload, CustomerUpdatePayload, createCustomer, updateCustomer } from "@/api/customers"
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

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!customer

  const createMutation = useMutation({
    mutationFn: (data: CustomerPayload) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Customer created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create customer")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { customer: CustomerUpdatePayload; id: string }) =>
      updateCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Customer updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update customer")
    },
  })

  const form = useForm({
    defaultValues: {
      email: customer?.email || "",
      first_name: customer?.first_name || "",
      last_name: customer?.last_name || "",
      phone_number: customer?.phone_number || "",
      password: "",
      is_active: customer?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      if (isEditing && customer) {
        const updateData: CustomerUpdatePayload = {
          email: value.email,
          first_name: value.first_name,
          last_name: value.last_name,
          phone_number: value.phone_number || undefined,
          is_active: value.is_active,
        }
        if (value.password) {
          updateData.password = value.password
        }
        await updateMutation.mutateAsync({ customer: updateData, id: customer.id })
      } else {
        const createData: CustomerPayload = {
          email: value.email,
          first_name: value.first_name,
          last_name: value.last_name,
          phone_number: value.phone_number || undefined,
          password: value.password,
        }
        await createMutation.mutateAsync(createData)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("email", customer?.email || "")
      form.setFieldValue("first_name", customer?.first_name || "")
      form.setFieldValue("last_name", customer?.last_name || "")
      form.setFieldValue("phone_number", customer?.phone_number || "")
      form.setFieldValue("password", "")
      form.setFieldValue("is_active", customer?.is_active ?? true)
    }
  }, [open, customer])

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Customer" : "Create Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the customer details below."
              : "Fill in the details to create a new customer."}
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
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="first_name"
              validators={{
                onChange: ({ value }) =>
                  !value ? "First name is required" : undefined,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="last_name"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Last name is required" : undefined,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

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
                  placeholder="customer@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="phone_number"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="+880 1XXX-XXXXXX"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
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
