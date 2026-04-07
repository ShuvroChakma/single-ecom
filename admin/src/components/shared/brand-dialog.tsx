import { Brand, BrandPayload, createBrand, updateBrand } from "@/api/brands"
import { getImageUrl } from "@/lib/utils"
import { ImageGalleryDialog } from "@/components/shared/image-gallery-dialog"
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
import { ImageIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand?: Brand
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function BrandDialog({ open, onOpenChange, brand }: BrandDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!brand
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const createMutation = useMutation({
    mutationFn: (data: BrandPayload) => createBrand({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      toast.success("Brand created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create brand")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { brand: Partial<BrandPayload>; id: string }) =>
      updateBrand({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      toast.success("Brand updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update brand")
    },
  })

  const form = useForm({
    defaultValues: {
      name: brand?.name || "",
      slug: brand?.slug || "",
      logo: brand?.logo || "",
      is_active: brand?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: BrandPayload = {
        name: value.name,
        slug: value.slug,
        logo: value.logo || undefined,
        is_active: value.is_active,
      }

      if (isEditing && brand) {
        await updateMutation.mutateAsync({ brand: payload, id: brand.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("name", brand?.name || "")
      form.setFieldValue("slug", brand?.slug || "")
      form.setFieldValue("logo", brand?.logo || "")
      form.setFieldValue("is_active", brand?.is_active ?? true)
    }
  }, [open, brand])

  const isPending = createMutation.isPending || updateMutation.isPending

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brand" : "Create Brand"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the brand details below."
              : "Fill in the details to create a new brand."}
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
                  placeholder="Brand name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    if (!isEditing) {
                      form.setFieldValue("slug", generateSlug(e.target.value))
                    }
                  }}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="slug"
            validators={{
              onChange: ({ value }) =>
                !value ? "Slug is required" : undefined,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="brand-slug"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="logo"
            children={(field) => (
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {field.state.value && (
                      <img
                        src={getImageUrl(field.state.value)}
                        alt="Brand logo"
                        className="h-16 w-16 rounded-lg object-cover border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGalleryOpen(true)}
                            >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {field.state.value ? "Change Logo" : "Select Logo"}
                            </Button>
                            {field.state.value && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.handleChange("")}
                                >
                                    Remove
                                </Button>
                            )}
                    </div>
                  </div>
                </div>
            )}
          />

                  <ImageGalleryDialog
                      open={isGalleryOpen}
                      onOpenChange={setIsGalleryOpen}
            onSelect={(url) => {
                          form.setFieldValue("logo", url)
                          setIsGalleryOpen(false)
                      }}
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
