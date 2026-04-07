import {
  ChargeType,
  DeliveryZone,
  DeliveryZonePayload,
  createDeliveryZone,
  updateDeliveryZone,
} from "@/api/delivery"
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
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DeliveryZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone?: DeliveryZone
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">
      {field.state.meta.errors.join(", ")}
    </p>
  ) : null
}

export function DeliveryZoneDialog({
  open,
  onOpenChange,
  zone,
}: DeliveryZoneDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!zone
  const [districtInput, setDistrictInput] = useState("")
  const [districts, setDistricts] = useState<string[]>(zone?.districts || [])
  const [chargeType, setChargeType] = useState<ChargeType>(zone?.charge_type || "FIXED")

  const createMutation = useMutation({
    mutationFn: (data: DeliveryZonePayload) => createDeliveryZone({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast.success("Delivery zone created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create delivery zone")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { zone: Partial<DeliveryZonePayload>; id: string }) =>
      updateDeliveryZone({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast.success("Delivery zone updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update delivery zone")
    },
  })

  const form = useForm({
    defaultValues: {
      name: zone?.name || "",
      charge_type: (zone?.charge_type || "FIXED") as ChargeType,
      base_charge: zone?.base_charge?.toString() || "0",
      per_kg_charge: zone?.per_kg_charge?.toString() || "",
      free_above: zone?.free_above?.toString() || "",
      min_days: zone?.min_days?.toString() || "1",
      max_days: zone?.max_days?.toString() || "3",
      display_order: zone?.display_order?.toString() || "0",
      is_active: zone?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: DeliveryZonePayload = {
        name: value.name,
        districts: districts,
        charge_type: value.charge_type,
        base_charge: parseFloat(value.base_charge) || 0,
        per_kg_charge:
          value.charge_type === "WEIGHT_BASED" && value.per_kg_charge
            ? parseFloat(value.per_kg_charge)
            : null,
        free_above: value.free_above ? parseFloat(value.free_above) : null,
        min_days: parseInt(value.min_days) || 1,
        max_days: parseInt(value.max_days) || 3,
        display_order: parseInt(value.display_order) || 0,
        is_active: value.is_active,
      }

      if (isEditing && zone) {
        await updateMutation.mutateAsync({ zone: payload, id: zone.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("name", zone?.name || "")
      form.setFieldValue("charge_type", (zone?.charge_type || "FIXED") as ChargeType)
      form.setFieldValue("base_charge", zone?.base_charge?.toString() || "0")
      form.setFieldValue("per_kg_charge", zone?.per_kg_charge?.toString() || "")
      form.setFieldValue("free_above", zone?.free_above?.toString() || "")
      form.setFieldValue("min_days", zone?.min_days?.toString() || "1")
      form.setFieldValue("max_days", zone?.max_days?.toString() || "3")
      form.setFieldValue("display_order", zone?.display_order?.toString() || "0")
      form.setFieldValue("is_active", zone?.is_active ?? true)
      setDistricts(zone?.districts || [])
      setDistrictInput("")
      setChargeType(zone?.charge_type || "FIXED")
    }
  }, [open, zone])

  const handleAddDistrict = () => {
    const trimmed = districtInput.trim()
    if (trimmed && !districts.includes(trimmed)) {
      setDistricts([...districts, trimmed])
      setDistrictInput("")
    }
  }

  const handleRemoveDistrict = (district: string) => {
    setDistricts(districts.filter((d) => d !== district))
  }

  const handleDistrictKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddDistrict()
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Delivery Zone" : "Create Delivery Zone"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the delivery zone details below."
              : "Fill in the details to create a new delivery zone."}
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
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Dhaka City"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="space-y-2">
            <Label>Districts</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type district name and press Enter"
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                onKeyDown={handleDistrictKeyDown}
              />
              <Button type="button" variant="outline" onClick={handleAddDistrict}>
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use * for catch-all zone (matches any district)
            </p>
            {districts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {districts.map((district) => (
                  <span
                    key={district}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {district}
                    <button
                      type="button"
                      onClick={() => handleRemoveDistrict(district)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <form.Field
            name="charge_type"
            children={(field) => (
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as ChargeType)
                    setChargeType(value as ChargeType)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select charge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Rate</SelectItem>
                    <SelectItem value="WEIGHT_BASED">Weight Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <form.Field
            name="base_charge"
            validators={{
              onChange: ({ value }) => {
                const num = parseFloat(value)
                if (isNaN(num) || num < 0)
                  return "Base charge must be a positive number"
                return undefined
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="base_charge">Base Charge *</Label>
                <Input
                  id="base_charge"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          {chargeType === "WEIGHT_BASED" && (
            <form.Field
              name="per_kg_charge"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="per_kg_charge">Per KG Charge</Label>
                  <Input
                    id="per_kg_charge"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          )}

          <form.Field
            name="free_above"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="free_above">Free Delivery Above</Label>
                <Input
                  id="free_above"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty for no free delivery threshold"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount get free delivery
                </p>
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="min_days"
              validators={{
                onChange: ({ value }) => {
                  const num = parseInt(value)
                  if (isNaN(num) || num < 1)
                    return "Minimum days must be at least 1"
                  return undefined
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="min_days">Min Delivery Days *</Label>
                  <Input
                    id="min_days"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="max_days"
              validators={{
                onChange: ({ value }) => {
                  const num = parseInt(value)
                  if (isNaN(num) || num < 1)
                    return "Maximum days must be at least 1"
                  return undefined
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="max_days">Max Delivery Days *</Label>
                  <Input
                    id="max_days"
                    type="number"
                    min="1"
                    placeholder="3"
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
            name="display_order"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
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
