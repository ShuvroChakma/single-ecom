import { Category, CategoryTreeResponse, createCategory, getCategoryTree, updateCategory } from "@/api/categories"
import { ImageUpload } from "@/components/shared/image-upload"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    is_active: z.boolean().default(true),
    icon: z.string().optional(),
    banner: z.string().optional(),
    parent_id: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

// Helper to flatten category tree for the select input
function flattenCategories(categories: CategoryTreeResponse[], level = 0): { id: string; name: string; level: number; path: string }[] {
    return categories.reduce((acc, cat) => {
        acc.push({ id: cat.id, name: cat.name, level, path: cat.path })
        if (cat.children) {
            acc.push(...flattenCategories(cat.children, level + 1))
        }
        return acc
    }, [] as { id: string; name: string; level: number; path: string }[])
}

function FieldInfo({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) {
        return null
    }

    return (
        <p className="text-[0.8rem] font-medium text-destructive">
            {field.state.meta.errors.map((error: any, i: number) => (
                <span key={i} className="block">
                    {typeof error === 'object' && error !== null
                        ? error.message || JSON.stringify(error)
                        : error}
                </span>
            ))}
        </p>
    )
}

interface CategoryDialogProps {
    category?: Category
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CategoryDialog({ category, open: controlledOpen, onOpenChange }: CategoryDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    // Helper to call onOpenChange callback or internal setter
    const setOpen = (value: boolean) => {
        if (onOpenChange) {
            onOpenChange(value)
        }
        if (!isControlled) {
            setInternalOpen(value)
        }
    }

    const queryClient = useQueryClient()
    const isEdit = !!category

    // Fetch categories for parent selection
    const { data: tree } = useQuery({
        queryKey: ["category-tree"],
        queryFn: getCategoryTree,
    })

    const categories = tree?.success ? flattenCategories(tree.data) : []

    const form = useForm({
        defaultValues: {
            name: category?.name || "",
            slug: category?.slug || "",
            is_active: category?.is_active ?? true,
            icon: category?.icon || "",
            banner: category?.banner || "",
            parent_id: category?.parent_id || undefined,
        } as CategoryFormValues,
        validatorAdapter: zodValidator(),
        validators: {
            onChange: categorySchema,
        },
        onSubmit: async ({ value }) => {
            const payload = {
                ...value,
                // Ensure parent_id is undefined if it's "root" or empty to match backend expectation
                parent_id: value.parent_id === "root" || !value.parent_id ? undefined : value.parent_id,
                // Ensure empty strings for images are sent as undefined if backend requires it, or keep as is if backend handles empty strings.
                // Based on schema, these are optional strings.
            }

            if (isEdit && category) {
                console.log("Submitting Update for Category:", category.id, payload)
                await updateMutation.mutate({ category: payload, id: category.id })
            } else {
                await createMutation.mutate(payload)
            }
        },
    })

    // Reset form when category changes
    useEffect(() => {
        if (open) {
            form.reset()
            // Small timeout or hack might be needed if form doesn't re-mount, 
            // but calling reset() with no args resets to *initial* defaultValues. 
            // We need to update defaultValues dynamically or manually set field values.
            // Best approach for TanStack Form is usually to use a key on the form component or 
            // manually setValue for each field.
            // For now, let's rely on the key={category?.id} approach in rendering or just simple reset if the component unmounts.
            // Actually, since we reuse the dialog, we should probably manually set values on open.
            if (category) {
                form.setFieldValue("name", category.name)
                form.setFieldValue("slug", category.slug)
                form.setFieldValue("is_active", category.is_active)
                form.setFieldValue("icon", category.icon || "")
                form.setFieldValue("banner", category.banner || "")
                form.setFieldValue("parent_id", category.parent_id || undefined)
            } else {
                form.reset()
            }
        }
    }, [category, open, form])


    const createMutation = useMutation({
        mutationFn: (data: any) => createCategory({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-tree"] })
            setOpen(false)
            toast.success("Category created successfully")
            form.reset()
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create category")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ category, id }: { category: any, id: string }) => updateCategory({ data: { category, id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-tree"] })
            setOpen(false)
            toast.success("Category updated successfully")
            form.reset()
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update category")
        },
    })

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Category" : "Create Category"}</DialogTitle>
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
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value)
                                        // Auto-generate slug from name if slug hasn't been manually touched
                                        // Only in create mode or if slug is empty
                                        const slugField = form.getFieldValue("slug")
                                        if (!slugField || slugField === field.state.value.toLowerCase().replace(/\s+/g, '-')) {
                                            form.setFieldValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
                                        }
                                    }}
                                />
                                <FieldInfo field={field} />
                            </div>
                        )}
                    />

                    <form.Field
                        name="slug"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Slug</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldInfo field={field} />
                            </div>
                        )}
                    />

                    <form.Field
                        name="parent_id"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label>Parent Category</Label>
                                <Select
                                    value={field.state.value || "root"}
                                    onValueChange={(val) => field.handleChange(val === "root" ? undefined : val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">None (Root Category)</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                                disabled={cat.level >= 2 || (isEdit && category?.id === cat.id)} // Prevent selecting self or too deep
                                            >
                                                <span style={{ paddingLeft: `${cat.level * 16}px` }}>
                                                    {cat.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Maximum nesting depth is 3 levels.
                                </p>
                                <FieldInfo field={field} />
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="icon"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <ImageUpload
                                        value={field.state.value}
                                        onChange={field.handleChange}
                                        onRemove={() => field.handleChange("")}
                                        type="icon"
                                    />
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        />

                        <form.Field
                            name="banner"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>Banner</Label>
                                    <ImageUpload
                                        value={field.state.value}
                                        onChange={field.handleChange}
                                        onRemove={() => field.handleChange("")}
                                        type="banner"
                                    />
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="is_active"
                        children={(field) => (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Category will be visible to users
                                    </p>
                                </div>
                                <Switch
                                    checked={field.state.value}
                                    onCheckedChange={field.handleChange}
                                />
                            </div>
                        )}
                    />

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
