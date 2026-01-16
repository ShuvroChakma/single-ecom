import {
    Attribute,
    AttributeGroup,
    AttributePayload,
    AttributeType,
    AttributeUpdatePayload,
    createAttribute,
    updateAttribute
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
import { Loader2, Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AttributeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    attribute?: Attribute
    groups: AttributeGroup[]
    defaultGroupId?: string
}

const ATTRIBUTE_TYPES: { value: AttributeType; label: string }[] = [
    { value: "TEXT", label: "Text" },
    { value: "NUMBER", label: "Number" },
    { value: "BOOLEAN", label: "Boolean (Yes/No)" },
    { value: "SELECT", label: "Single Select" },
    { value: "MULTI_SELECT", label: "Multi Select" },
]

function FieldInfo({ field }: { field: any }) {
    return field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
    ) : null
}

export function AttributeDialog({ open, onOpenChange, attribute, groups, defaultGroupId }: AttributeDialogProps) {
    const queryClient = useQueryClient()
    const isEditing = !!attribute
    const [options, setOptions] = useState<string[]>(attribute?.options || [])
    const [newOption, setNewOption] = useState("")

    const createMutation = useMutation({
        mutationFn: (data: AttributePayload) => createAttribute({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
            toast.success("Attribute created successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create attribute")
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: { attribute: AttributeUpdatePayload; id: string }) =>
            updateAttribute({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
            toast.success("Attribute updated successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update attribute")
        },
    })

    const form = useForm({
        defaultValues: {
            group_id: attribute?.group_id || defaultGroupId || "",
            code: attribute?.code || "",
            name: attribute?.name || "",
            type: attribute?.type || "TEXT" as AttributeType,
            is_required: attribute?.is_required || false,
            is_filterable: attribute?.is_filterable || false,
            sort_order: attribute?.sort_order || 0,
            is_active: attribute?.is_active ?? true,
        },
        onSubmit: async ({ value }) => {
            const payload = {
                ...value,
                options: ["SELECT", "MULTI_SELECT"].includes(value.type) ? options : undefined,
            }

            if (isEditing && attribute) {
                await updateMutation.mutateAsync({
                    attribute: payload,
                    id: attribute.id
                })
            } else {
                await createMutation.mutateAsync(payload as AttributePayload)
            }
        },
    })

    useEffect(() => {
        if (open) {
            form.reset()
            form.setFieldValue("group_id", attribute?.group_id || defaultGroupId || "")
            form.setFieldValue("code", attribute?.code || "")
            form.setFieldValue("name", attribute?.name || "")
            form.setFieldValue("type", attribute?.type || "TEXT")
            form.setFieldValue("is_required", attribute?.is_required || false)
            form.setFieldValue("is_filterable", attribute?.is_filterable || false)
            form.setFieldValue("sort_order", attribute?.sort_order || 0)
            form.setFieldValue("is_active", attribute?.is_active ?? true)
            setOptions(attribute?.options || [])
            setNewOption("")
        }
    }, [open, attribute, defaultGroupId])

    const addOption = () => {
        if (newOption.trim() && !options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()])
            setNewOption("")
        }
    }

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index))
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const currentType = form.getFieldValue("type")
    const showOptions = currentType === "SELECT" || currentType === "MULTI_SELECT"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Attribute" : "Create Attribute"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the attribute details."
                            : "Create a new product attribute."}
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
                        name="group_id"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value) return "Group is required"
                                return undefined
                            },
                        }}
                        children={(field) => (
                            <div className="space-y-2">
                                <Label>Group *</Label>
                                <Select value={field.state.value} onValueChange={field.handleChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldInfo field={field} />
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="code"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value) return "Code is required"
                                    if (!/^[a-z_]+$/.test(value)) return "Only lowercase letters and underscores"
                                    return undefined
                                },
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g. product_weight"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                                        disabled={isEditing}
                                    />
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        />

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
                                    <Label htmlFor="name">Display Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Product Weight"
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
                            name="type"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as AttributeType)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ATTRIBUTE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                    </div>

                    {showOptions && (
                        <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add option..."
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            addOption()
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={addOption}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {options.map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                                        >
                                            {option}
                                            <button
                                                type="button"
                                                onClick={() => removeOption(index)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <form.Field
                            name="is_required"
                            children={(field) => (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_required"
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                    <Label htmlFor="is_required" className="text-sm">Required</Label>
                                </div>
                            )}
                        />

                        <form.Field
                            name="is_filterable"
                            children={(field) => (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_filterable"
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                    <Label htmlFor="is_filterable" className="text-sm">Filterable</Label>
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
                                    <Label htmlFor="is_active" className="text-sm">Active</Label>
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
