"use client"

import { createSlide, Slide, SlidePayload, SlideType, updateSlide, uploadSlideImage } from "@/api/slides"
import { ImageGalleryDialog } from "@/components/shared/image-gallery-dialog"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { useAuth } from "@/lib/auth"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderOpen, ImagePlus, Loader2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface SlideDialogProps {
    slide?: Slide
    open: boolean
    onOpenChange: (open: boolean) => void
}

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
    { value: "BANNER", label: "Banner" },
    { value: "PROMO", label: "Promo" },
    { value: "OFFER", label: "Offer" },
    { value: "COLLECTION", label: "Collection" },
]

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

export function SlideDialog({ slide, open, onOpenChange }: SlideDialogProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const isEdit = !!slide
    const [isUploading, setIsUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState("")
    const [showGallery, setShowGallery] = useState(false)

    const form = useForm({
        defaultValues: {
            title: "",
            subtitle: "",
            description: "",
            image_url: "",
            image_alt: "",
            link_url: "",
            link_text: "Shop Now",
            slide_type: "BANNER" as SlideType,
            text_color: "#FFFFFF",
            overlay_color: "",
            sort_order: 0,
            is_active: true,
        },
        onSubmit: async ({ value }) => {
            const payload: SlidePayload = {
                title: value.title,
                subtitle: value.subtitle || undefined,
                description: value.description || undefined,
                image_url: value.image_url,
                image_alt: value.image_alt || undefined,
                link_url: value.link_url || undefined,
                link_text: value.link_text || undefined,
                slide_type: value.slide_type,
                text_color: value.text_color || undefined,
                overlay_color: value.overlay_color || undefined,
                sort_order: value.sort_order,
                is_active: value.is_active,
            }

            if (isEdit && slide) {
                await updateMutation.mutateAsync({ slide: payload, id: slide.id })
            } else {
                await createMutation.mutateAsync(payload)
            }
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: SlidePayload) => createSlide({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slides"] })
            toast.success("Slide created successfully")
            onOpenChange(false)
            form.reset()
            setImageUrl("")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create slide")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ slide, id }: { slide: Partial<SlidePayload>; id: string }) =>
            updateSlide({ data: { slide, id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slides"] })
            toast.success("Slide updated successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update slide")
        },
    })

    // Populate form when editing
    useEffect(() => {
        if (open && slide) {
            form.setFieldValue("title", slide.title)
            form.setFieldValue("subtitle", slide.subtitle || "")
            form.setFieldValue("description", slide.description || "")
            form.setFieldValue("image_url", slide.image_url)
            form.setFieldValue("image_alt", slide.image_alt || "")
            form.setFieldValue("link_url", slide.link_url || "")
            form.setFieldValue("link_text", slide.link_text || "Shop Now")
            form.setFieldValue("slide_type", slide.slide_type)
            form.setFieldValue("text_color", slide.text_color || "#FFFFFF")
            form.setFieldValue("overlay_color", slide.overlay_color || "")
            form.setFieldValue("sort_order", slide.sort_order)
            form.setFieldValue("is_active", slide.is_active)
            setImageUrl(slide.image_url)
        } else if (open && !slide) {
            form.reset()
            setImageUrl("")
        }
    }, [open, slide])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const result = await uploadSlideImage(file, token || undefined)
            setImageUrl(result.url)
            form.setFieldValue("image_url", result.url)
            toast.success("Image uploaded successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
        } finally {
            setIsUploading(false)
        }
    }

    const removeImage = () => {
        setImageUrl("")
        form.setFieldValue("image_url", "")
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Slide" : "Create Slide"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update slide details below." : "Fill in the details to create a new slide."}
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
                    {/* Title */}
                    <form.Field
                        name="title"
                        validators={{
                            onChange: ({ value }) =>
                                !value ? 'Title is required' : undefined,
                        }}
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                    placeholder="Slide title"
                                />
                                <FieldInfo field={field} />
                            </div>
                        )}
                    />

                    {/* Subtitle */}
                    <form.Field
                        name="subtitle"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="subtitle">Subtitle</Label>
                                <Input
                                    id="subtitle"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Optional subtitle"
                                />
                            </div>
                        )}
                    />

                    {/* Description */}
                    <form.Field
                        name="description"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>
                        )}
                    />

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Slide Image *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGallery(true)}
                            >
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Media Library
                            </Button>
                        </div>
                        {imageUrl ? (
                            <div className="relative rounded-md border overflow-hidden">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 h-6 w-6"
                                    onClick={removeImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <img
                                    src={imageUrl.startsWith("http") ? imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${imageUrl}`}
                                    alt="Slide preview"
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                        ) : (
                            <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted h-48">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImagePlus className="h-10 w-10" />
                                        <span className="text-sm font-medium">Upload slide image</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <ImageGalleryDialog
                        open={showGallery}
                        onOpenChange={setShowGallery}
                        onSelect={(url) => {
                            setImageUrl(url)
                            form.setFieldValue("image_url", url)
                        }}
                    />

                    {/* Image Alt */}
                    <form.Field
                        name="image_alt"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="image_alt">Image Alt Text</Label>
                                <Input
                                    id="image_alt"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Alt text for accessibility"
                                />
                            </div>
                        )}
                    />

                    {/* Link URL and Text */}
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="link_url"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="link_url">Link URL</Label>
                                    <Input
                                        id="link_url"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="/collections/new"
                                    />
                                </div>
                            )}
                        />
                        <form.Field
                            name="link_text"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="link_text">Button Text</Label>
                                    <Input
                                        id="link_text"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Shop Now"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    {/* Type and Order */}
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="slide_type"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label>Slide Type</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(value) => field.handleChange(value as SlideType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SLIDE_TYPES.map((type) => (
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
                                        min={0}
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="text_color"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="text_color">Text Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="text_color"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="#FFFFFF"
                                        />
                                        <input
                                            type="color"
                                            value={field.state.value || "#FFFFFF"}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-10 w-10 rounded border cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        />
                        <form.Field
                            name="overlay_color"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="overlay_color">Overlay Color</Label>
                                    <Input
                                        id="overlay_color"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="rgba(0,0,0,0.5)"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    {/* Active Status */}
                    <form.Field
                        name="is_active"
                        children={(field) => (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Slide will be visible on the homepage
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={field.state.value}
                                    onCheckedChange={field.handleChange}
                                />
                            </div>
                        )}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !form.state.values.image_url}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
