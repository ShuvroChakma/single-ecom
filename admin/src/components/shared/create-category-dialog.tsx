import { CategoryTreeResponse, createCategory, getCategoryTree } from "@/api/categories"
import { ImageUpload } from "@/components/shared/image-upload"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    parent_id: z.string().optional(),
    is_active: z.boolean(),
    icon: z.string().optional(),
    banner: z.string().optional(),
})

interface CreateCategoryDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

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
    return (
        <>
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <p className="text-[0.8rem] font-medium text-destructive">
                    {field.state.meta.errors.map((error: any, i: number) => (
                        <span key={i} className="block">
                            {typeof error === 'object' && error !== null
                                ? error.message || JSON.stringify(error)
                                : error}
                        </span>
                    ))}
                </p>
            ) : null}
        </>
    )
}

export function CreateCategoryDialog() {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data: tree } = useQuery({
        queryKey: ["category-tree"],
        queryFn: getCategoryTree,
    })

    const categories = tree?.success ? flattenCategories(tree.data) : []

    const createMutation = useMutation({
        mutationFn: (data: any) => createCategory({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-tree"] })
            setOpen(false)
            toast.success("Category created successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create category")
        },
    })

    const form = useForm({
        defaultValues: {
            name: "",
            slug: "",
            parent_id: undefined as string | undefined,
            is_active: true,
            icon: "",
            banner: "",
        },
        validatorAdapter: zodValidator(),
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = {
                ...value,
                parent_id: value.parent_id === "root" || !value.parent_id ? undefined : value.parent_id,
                icon: value.icon || undefined,
                banner: value.banner || undefined,
            }
            createMutation.mutate(payload)
            form.reset()
        },
    })

    const handleNameChange = (name: string, field: any) => {
        field.handleChange(name)
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
        form.setFieldValue("slug", slug)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>
                        Add a new category to your catalog.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
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
                                name="name"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Name</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => handleNameChange(e.target.value, field)}
                                            placeholder="Category name"
                                            aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
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
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="category-slug"
                                            aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                                        />
                                        <FieldInfo field={field} />
                                    </div>
                                )}
                            />
                        </div>

                        <form.Field
                            name="parent_id"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>Parent Category</Label>
                                    <Select
                                        value={field.state.value || "root"}
                                        onValueChange={(val) => field.handleChange(val === "root" ? undefined : val)}
                                    >
                                        <SelectTrigger aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                                            <SelectValue placeholder="Select parent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="root">None (Root Category)</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={cat.id}
                                                    disabled={cat.level >= 2}
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
                                            className={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "h-32 w-full border-destructive ring-destructive/20" : "h-32 w-full"}
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
                                            className={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "h-32 w-full border-destructive ring-destructive/20" : "h-32 w-full"}
                                        />
                                        <FieldInfo field={field} />
                                    </div>
                                )}
                            />
                        </div>

                        <form.Field
                            name="is_active"
                            children={(field) => (
                                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label>Active Status</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Visible in store.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                </div>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" disabled={!canSubmit}>
                                        {isSubmitting || createMutation.isPending ? (
                                            <Plus className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            "Create Category"
                                        )}
                                    </Button>
                                )}
                            />
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
