import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
    ChevronDown, ChevronRight, Filter,
    Layers,
    Loader2,
    MoreHorizontal, Plus,
    Tag,
    ToggleLeft
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
    Attribute,
    AttributeGroupWithAttributes,
    deleteAttribute,
    deleteAttributeGroup,
    getAttributeGroups
} from "@/api/attributes"
import { AttributeDialog } from "@/components/shared/attribute-dialog"
import { AttributeGroupDialog } from "@/components/shared/attribute-group-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Route = createFileRoute("/dashboard/catalog/attributes/")({
    component: AttributesPage,
})

const TYPE_LABELS: Record<string, string> = {
    TEXT: "Text",
    NUMBER: "Number",
    BOOLEAN: "Boolean",
    SELECT: "Select",
    MULTI_SELECT: "Multi Select",
}

function AttributesPage() {
    const queryClient = useQueryClient()
    const [selectedGroup, setSelectedGroup] = useState<AttributeGroupWithAttributes | undefined>()
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | undefined>()
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
    const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<AttributeGroupWithAttributes | null>(null)
    const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [addAttributeToGroupId, setAddAttributeToGroupId] = useState<string | undefined>()

    const { data, isLoading } = useQuery({
        queryKey: ['attributeGroups'],
        queryFn: () => getAttributeGroups(),
    })

    const deleteGroupMutation = useMutation({
        mutationFn: (id: string) => deleteAttributeGroup({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
            toast.success("Attribute group deleted successfully")
            setGroupToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete attribute group")
        },
    })

    const deleteAttributeMutation = useMutation({
        mutationFn: (id: string) => deleteAttribute({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attributeGroups"] })
            toast.success("Attribute deleted successfully")
            setAttributeToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete attribute")
        },
    })

    const handleEditGroup = (group: AttributeGroupWithAttributes) => {
        setSelectedGroup(group)
        setIsGroupDialogOpen(true)
    }

    const handleCreateGroup = () => {
        setSelectedGroup(undefined)
        setIsGroupDialogOpen(true)
    }

    const handleEditAttribute = (attr: Attribute) => {
        setSelectedAttribute(attr)
        setAddAttributeToGroupId(undefined)
        setIsAttributeDialogOpen(true)
    }

    const handleCreateAttribute = (groupId?: string) => {
        setSelectedAttribute(undefined)
        setAddAttributeToGroupId(groupId)
        setIsAttributeDialogOpen(true)
    }

    const toggleExpanded = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    const expandAll = () => {
        if (data?.success) {
            setExpandedGroups(new Set(data.data.map(g => g.id)))
        }
    }

    const collapseAll = () => {
        setExpandedGroups(new Set())
    }

    const groups = data?.success ? data.data : []
    const flatGroups = groups.map(g => ({ id: g.id, name: g.name, sort_order: g.sort_order, is_active: g.is_active, created_at: g.created_at, updated_at: g.updated_at }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
                    <p className="text-muted-foreground">
                        Manage product attributes and groups
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCreateAttribute}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                    </Button>
                    <Button onClick={handleCreateGroup}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Group
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : groups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No attribute groups yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Create your first attribute group to get started
                        </p>
                        <Button onClick={handleCreateGroup}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={expandAll}>
                            Expand All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={collapseAll}>
                            Collapse All
                        </Button>
                    </div>

                    {groups.map(group => {
                        const isExpanded = expandedGroups.has(group.id)

                        return (
                            <Card key={group.id}>
                                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(group.id)}>
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <CollapsibleTrigger asChild>
                                                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5" />
                                                    )}
                                                    <Layers className="h-5 w-5 text-primary" />
                                                    <CardTitle className="text-lg">{group.name}</CardTitle>
                                                    <Badge variant="secondary" className="ml-2">
                                                        {group.attributes.length} attributes
                                                    </Badge>
                                                    {!group.is_active && (
                                                        <Badge variant="outline">Inactive</Badge>
                                                    )}
                                                </button>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCreateAttribute(group.id)
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                                            Edit Group
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setGroupToDelete(group)}
                                                            className="text-destructive"
                                                        >
                                                            Delete Group
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CollapsibleContent>
                                        <CardContent className="pt-0">
                                            {group.attributes.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-4 text-center">
                                                    No attributes in this group yet
                                                </p>
                                            ) : (
                                                <div className="border rounded-lg divide-y">
                                                    {group.attributes.map(attr => (
                                                        <div key={attr.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                                                            <div className="flex items-center gap-4">
                                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{attr.name}</span>
                                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                                            {attr.code}
                                                                        </code>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {TYPE_LABELS[attr.type] || attr.type}
                                                                        </Badge>
                                                                        {attr.is_required && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Required
                                                                            </Badge>
                                                                        )}
                                                                        {attr.is_filterable && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                <Filter className="h-3 w-3 mr-1" />
                                                                                Filterable
                                                                            </Badge>
                                                                        )}
                                                                        {!attr.is_active && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                <ToggleLeft className="h-3 w-3 mr-1" />
                                                                                Inactive
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleEditAttribute(attr)}>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setAttributeToDelete(attr)}
                                                                        className="text-destructive"
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        )
                    })}
                </div>
            )}

            <AttributeGroupDialog
                key={selectedGroup?.id || 'new-group'}
                open={isGroupDialogOpen}
                onOpenChange={setIsGroupDialogOpen}
                group={selectedGroup}
            />

            <AttributeDialog
                key={selectedAttribute?.id || addAttributeToGroupId || 'new-attr'}
                open={isAttributeDialogOpen}
                onOpenChange={setIsAttributeDialogOpen}
                attribute={selectedAttribute}
                groups={flatGroups}
                defaultGroupId={addAttributeToGroupId}
            />

            <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attribute Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{groupToDelete?.name}"?
                            This will also delete all {groupToDelete?.attributes.length || 0} attributes in this group.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteGroupMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => groupToDelete && deleteGroupMutation.mutate(groupToDelete.id)}
                            disabled={deleteGroupMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!attributeToDelete} onOpenChange={(open) => !open && setAttributeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete attribute "{attributeToDelete?.name}"?
                            This will remove this attribute from all products.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAttributeMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => attributeToDelete && deleteAttributeMutation.mutate(attributeToDelete.id)}
                            disabled={deleteAttributeMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAttributeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
