import {
  DiscountType,
  PromoCode,
  PromoCodePayload,
  createPromoCode,
  updatePromoCode,
} from "@/api/promo"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface PromoCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promoCode?: PromoCode
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function PromoCodeDialog({ open, onOpenChange, promoCode }: PromoCodeDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!promoCode
  const [discountType, setDiscountType] = useState<DiscountType>(promoCode?.discount_type || "PERCENTAGE")

  // Default dates: starts now, expires in 30 days
  const defaultStartDate = format(new Date(), "yyyy-MM-dd'T'HH:mm")
  const defaultEndDate = format(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd'T'HH:mm"
  )

  const createMutation = useMutation({
    mutationFn: (data: PromoCodePayload) => createPromoCode({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo code created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create promo code")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { promo: Partial<PromoCodePayload>; id: string }) =>
      updatePromoCode({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      toast.success("Promo code updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update promo code")
    },
  })

  const form = useForm({
    defaultValues: {
      code: promoCode?.code || "",
      description: promoCode?.description || "",
      discount_type: (promoCode?.discount_type || "PERCENTAGE") as DiscountType,
      discount_value: promoCode?.discount_value?.toString() || "",
      max_discount: promoCode?.max_discount?.toString() || "",
      min_order_amount: promoCode?.min_order_amount?.toString() || "",
      max_total_uses: promoCode?.max_total_uses?.toString() || "",
      max_uses_per_user: promoCode?.max_uses_per_user?.toString() || "1",
      starts_at: promoCode?.starts_at
        ? format(new Date(promoCode.starts_at), "yyyy-MM-dd'T'HH:mm")
        : defaultStartDate,
      expires_at: promoCode?.expires_at
        ? format(new Date(promoCode.expires_at), "yyyy-MM-dd'T'HH:mm")
        : defaultEndDate,
      first_order_only: promoCode?.first_order_only ?? false,
      is_active: promoCode?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: PromoCodePayload = {
        code: value.code.toUpperCase(),
        description: value.description || undefined,
        discount_type: value.discount_type,
        discount_value: parseFloat(value.discount_value),
        max_discount: value.max_discount ? parseFloat(value.max_discount) : undefined,
        min_order_amount: value.min_order_amount ? parseFloat(value.min_order_amount) : undefined,
        max_total_uses: value.max_total_uses ? parseInt(value.max_total_uses) : undefined,
        max_uses_per_user: value.max_uses_per_user ? parseInt(value.max_uses_per_user) : 1,
        starts_at: new Date(value.starts_at).toISOString(),
        expires_at: new Date(value.expires_at).toISOString(),
        first_order_only: value.first_order_only,
        is_active: value.is_active,
      }

      if (isEditing && promoCode) {
        await updateMutation.mutateAsync({ promo: payload, id: promoCode.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      const type = (promoCode?.discount_type || "PERCENTAGE") as DiscountType
      setDiscountType(type)
      form.reset()
      form.setFieldValue("code", promoCode?.code || "")
      form.setFieldValue("description", promoCode?.description || "")
      form.setFieldValue("discount_type", type)
      form.setFieldValue("discount_value", promoCode?.discount_value?.toString() || "")
      form.setFieldValue("max_discount", promoCode?.max_discount?.toString() || "")
      form.setFieldValue("min_order_amount", promoCode?.min_order_amount?.toString() || "")
      form.setFieldValue("max_total_uses", promoCode?.max_total_uses?.toString() || "")
      form.setFieldValue("max_uses_per_user", promoCode?.max_uses_per_user?.toString() || "1")
      form.setFieldValue(
        "starts_at",
        promoCode?.starts_at
          ? format(new Date(promoCode.starts_at), "yyyy-MM-dd'T'HH:mm")
          : defaultStartDate
      )
      form.setFieldValue(
        "expires_at",
        promoCode?.expires_at
          ? format(new Date(promoCode.expires_at), "yyyy-MM-dd'T'HH:mm")
          : defaultEndDate
      )
      form.setFieldValue("first_order_only", promoCode?.first_order_only ?? false)
      form.setFieldValue("is_active", promoCode?.is_active ?? true)
    }
  }, [open, promoCode])

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the promo code details below."
              : "Fill in the details to create a new promo code."}
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
              name="code"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Code is required"
                  if (value.length < 3) return "Code must be at least 3 characters"
                  return undefined
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="SUMMER2024"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="discount_type"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      const type = value as DiscountType
                      field.handleChange(type)
                      setDiscountType(type)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <form.Field
            name="description"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Summer sale discount"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          />

          {discountType !== "FREE_SHIPPING" && (
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="discount_value"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "Discount value is required"
                    const num = parseFloat(value)
                    if (isNaN(num) || num <= 0) return "Must be greater than 0"
                    if (discountType === "PERCENTAGE" && num > 100)
                      return "Percentage cannot exceed 100"
                    return undefined
                  },
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      Discount Value * {discountType === "PERCENTAGE" ? "(%)" : ""}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      min="0"
                      max={discountType === "PERCENTAGE" ? "100" : undefined}
                      placeholder={discountType === "PERCENTAGE" ? "10" : "500"}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              {discountType === "PERCENTAGE" && (
                <form.Field
                  name="max_discount"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="max_discount">Max Discount Cap</Label>
                      <Input
                        id="max_discount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1000"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum discount amount for percentage discounts
                      </p>
                    </div>
                  )}
                />
              )}
            </div>
          )}

          <form.Field
            name="min_order_amount"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">Minimum Order Amount</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum order value required to use this code
                </p>
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="starts_at"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Start date is required"
                  return undefined
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Starts At *</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="expires_at"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Expiry date is required"
                  return undefined
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires At *</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="max_total_uses"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="max_total_uses">Total Usage Limit</Label>
                  <Input
                    id="max_total_uses"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                </div>
              )}
            />

            <form.Field
              name="max_uses_per_user"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="max_uses_per_user">Uses Per Customer</Label>
                  <Input
                    id="max_uses_per_user"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <form.Field
              name="first_order_only"
              children={(field) => (
                <div className="flex items-center gap-2">
                  <Switch
                    id="first_order_only"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  <Label htmlFor="first_order_only">First Order Only</Label>
                </div>
              )}
            />

            <form.Field
              name="is_active"
              children={(field) => (
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  <Label htmlFor="is_active">Active</Label>
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
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
