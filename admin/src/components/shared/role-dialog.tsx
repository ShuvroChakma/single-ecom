import { getPermissions, Permission } from "@/api/permissions"
import { createRole, getRole, Role, RolePayload, RoleUpdatePayload, RoleWithPermissions, updateRole } from "@/api/roles"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface RoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    role?: Role & { permissions_count?: number }
}

function FieldInfo({ field }: { field: any }) {
    return field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</p>
    ) : null
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
    const queryClient = useQueryClient()
    const isEditing = !!role
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionSearch, setPermissionSearch] = useState("")
    const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())

    // Fetch all permissions
    const { data: permissionsData, isLoading: loadingPermissions } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => getPermissions(),
        enabled: open,
    })

    // Fetch role details with permissions when editing
    const { data: roleDetails, isLoading: loadingRole } = useQuery({
        queryKey: ['role', role?.id],
        queryFn: () => getRole({ data: { id: role!.id } }),
        enabled: open && isEditing && !!role?.id,
    })

    const permissions = permissionsData?.success ? permissionsData.data : []

    // Filter permissions by search
    const filteredPermissions = permissions.filter(p =>
        p.code.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(permissionSearch.toLowerCase()))
    )

    // Group permissions by resource
    const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
        const resource = perm.resource || 'other'
        if (!acc[resource]) acc[resource] = []
        acc[resource].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    const createMutation = useMutation({
        mutationFn: (data: RolePayload) => createRole({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            toast.success("Role created successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create role")
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: { role: RoleUpdatePayload; id: string }) =>
            updateRole({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            toast.success("Role updated successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update role")
        },
    })

    const form = useForm({
        defaultValues: {
            name: role?.name || "",
            description: role?.description || "",
        },
        onSubmit: async ({ value }) => {
            if (isEditing && role) {
                const updateData: RoleUpdatePayload = {
                    name: value.name,
                    description: value.description || undefined,
                    permission_ids: selectedPermissions,
                }
                await updateMutation.mutateAsync({ role: updateData, id: role.id })
            } else {
                const createData: RolePayload = {
                    name: value.name,
                    description: value.description || undefined,
                    permission_ids: selectedPermissions,
                }
                await createMutation.mutateAsync(createData)
            }
        },
    })

    // Initialize selected permissions when role details load
    useEffect(() => {
        if (open) {
            form.reset()
            form.setFieldValue("name", role?.name || "")
            form.setFieldValue("description", role?.description || "")
            setPermissionSearch("")
            setExpandedResources(new Set())

            // Set selected permissions from role details
            if (isEditing && roleDetails?.success) {
                const roleData = roleDetails.data as RoleWithPermissions
                setSelectedPermissions(roleData.permissions?.map(p => p.id) || [])
            } else if (!isEditing) {
                setSelectedPermissions([])
            }
        }
    }, [open, role, roleDetails])

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    const toggleResourcePermissions = (resource: string, perms: Permission[]) => {
        const permIds = perms.map(p => p.id)
        const allSelected = permIds.every(id => selectedPermissions.includes(id))

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !permIds.includes(id)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...permIds])])
        }
    }

    const toggleExpanded = (resource: string) => {
        setExpandedResources(prev => {
            const next = new Set(prev)
            if (next.has(resource)) {
                next.delete(resource)
            } else {
                next.add(resource)
            }
            return next
        })
    }

    const expandAll = () => {
        setExpandedResources(new Set(Object.keys(groupedPermissions)))
    }

    const collapseAll = () => {
        setExpandedResources(new Set())
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const isLoading = loadingPermissions || (isEditing && loadingRole)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the role details and permissions."
                            : "Fill in the details to create a new role."}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
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
                                validators={{
                                    onChange: ({ value }) => {
                                        if (!value) return "Role name is required"
                                        if (value.length < 2) return "Role name must be at least 2 characters"
                                        return undefined
                                    },
                                }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="MANAGER"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                            disabled={role?.is_system}
                                        />
                                        {role?.is_system && (
                                            <p className="text-xs text-muted-foreground">
                                                System role name cannot be changed
                                            </p>
                                        )}
                                        <FieldInfo field={field} />
                                    </div>
                                )}
                            />

                            <form.Field
                                name="description"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="Role description..."
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <FieldInfo field={field} />
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Permissions ({selectedPermissions.length} selected)</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={expandAll}
                                        className="text-xs h-7"
                                    >
                                        Expand All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={collapseAll}
                                        className="text-xs h-7"
                                    >
                                        Collapse All
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search permissions..."
                                    value={permissionSearch}
                                    onChange={(e) => setPermissionSearch(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>

                            <ScrollArea className="h-[280px] border rounded-md p-3">
                                {Object.entries(groupedPermissions).length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No permissions found
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {Object.entries(groupedPermissions).sort().map(([resource, perms]) => {
                                            const allSelected = perms.every(p => selectedPermissions.includes(p.id))
                                            const someSelected = perms.some(p => selectedPermissions.includes(p.id))
                                            const isExpanded = expandedResources.has(resource)
                                            const selectedCount = perms.filter(p => selectedPermissions.includes(p.id)).length

                                            return (
                                                <Collapsible
                                                    key={resource}
                                                    open={isExpanded}
                                                    onOpenChange={() => toggleExpanded(resource)}
                                                >
                                                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1.5 rounded hover:bg-muted/70 transition-colors">
                                                        <Checkbox
                                                            checked={allSelected}
                                                            ref={(el) => {
                                                                if (el && someSelected && !allSelected) {
                                                                    el.dataset.state = "indeterminate"
                                                                }
                                                            }}
                                                            onCheckedChange={(e) => {
                                                                e.preventDefault?.()
                                                                toggleResourcePermissions(resource, perms)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={role?.is_system}
                                                        />
                                                        <CollapsibleTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-2 flex-1 text-left"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                                <span className="font-medium text-sm capitalize">
                                                                    {resource.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({selectedCount}/{perms.length})
                                                                </span>
                                                            </button>
                                                        </CollapsibleTrigger>
                                                    </div>
                                                    <CollapsibleContent>
                                                        <div className="grid grid-cols-2 gap-1 pl-6 pt-2">
                                                            {perms.map(perm => (
                                                                <div
                                                                    key={perm.id}
                                                                    className="flex items-start gap-2 p-2 rounded hover:bg-muted/30"
                                                                >
                                                                    <Checkbox
                                                                        id={perm.id}
                                                                        checked={selectedPermissions.includes(perm.id)}
                                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                                        disabled={role?.is_system}
                                                                    />
                                                                    <label
                                                                        htmlFor={perm.id}
                                                                        className="text-sm cursor-pointer flex-1"
                                                                    >
                                                                        <code className="text-xs bg-muted px-1 rounded">
                                                                            {perm.code}
                                                                        </code>
                                                                        {perm.description && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                {perm.description}
                                                                            </p>
                                                                        )}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
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
                            <Button type="submit" disabled={isPending || role?.is_system}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
