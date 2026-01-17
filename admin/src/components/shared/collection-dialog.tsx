import { Collection, CollectionPayload, createCollection, updateCollection } from "@/api/collections"
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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ImageIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection?: Collection
}

function FieldInfo({ field }: { field: any }) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
  ) : null
}

export function CollectionDialog({ open, onOpenChange, collection }: CollectionDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!collection
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const createMutation = useMutation({
    mutationFn: (data: CollectionPayload) => createCollection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection created successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create collection")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { collection: Partial<CollectionPayload>; id: string }) =>
      updateCollection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update collection")
    },
  })

  const form = useForm({
    defaultValues: {
      name: collection?.name || "",
      slug: collection?.slug || "",
      description: collection?.description || "",
      banner_image: collection?.banner_image || "",
      is_active: collection?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload: CollectionPayload = {
        name: value.name,
        slug: value.slug,
        description: value.description || undefined,
        banner_image: value.banner_image || undefined,
        is_active: value.is_active,
      }

      if (isEditing && collection) {
        await updateMutation.mutateAsync({ collection: payload, id: collection.id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      form.setFieldValue("name", collection?.name || "")
      form.setFieldValue("slug", collection?.slug || "")
      form.setFieldValue("description", collection?.description || "")
      form.setFieldValue("banner_image", collection?.banner_image || "")
      form.setFieldValue("is_active", collection?.is_active ?? true)
    }
  }, [open, collection])

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
          <DialogTitle>{isEditing ? "Edit Collection" : "Create Collection"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the collection details below."
              : "Fill in the details to create a new collection."}
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
                  placeholder="Collection name"
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
                  placeholder="collection-slug"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Collection description"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          />

          <form.Field
            name="banner_image"
            children={(field) => (
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="flex items-center gap-4">
                  {field.state.value && (
                    <img
                      src={getImageUrl(field.state.value)}
                      alt="Collection banner"
                      className="h-20 w-32 rounded-lg object-cover border"
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
                      {field.state.value ? "Change Image" : "Select Image"}
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
              form.setFieldValue("banner_image", url)
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
