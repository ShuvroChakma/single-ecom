import { uploadCategoryImage } from "@/api/uploads"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove: () => void
    type?: 'icon' | 'banner'
    disabled?: boolean
    className?: string
}

import { ImageGalleryDialog } from "./image-gallery-dialog"

export function ImageUpload({
    value,
    onChange,
    onRemove,
    type = 'icon',
    disabled,
    className
}: ImageUploadProps) {
    const { token } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const [showGallery, setShowGallery] = useState(false)

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const res = await uploadCategoryImage(file, type, token || undefined)
            onChange(res.url)
            toast.success("Image uploaded successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    if (value) {
        return (
            <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md border border-border bg-background", className)}>
                <div className="absolute top-2 right-2 z-10">
                    <Button
                        type="button"
                        onClick={onRemove}
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <img
                    src={value.startsWith("http") ? value : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${value}`}
                    alt="Upload"
                    className="h-full w-full object-cover"
                />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className={cn("relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted", className)}>
                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={onUpload}
                    disabled={disabled || isUploading}
                />
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs font-medium">Upload {type}</span>
                    </div>
                )}
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowGallery(true)}
                disabled={disabled || isUploading}
            >
                <ImagePlus className="mr-2 h-4 w-4" />
                Select from Gallery
            </Button>

            <ImageGalleryDialog
                open={showGallery}
                onOpenChange={setShowGallery}
                onSelect={(url) => {
                    onChange(url)
                    setShowGallery(false)
                }}
            />
        </div>
    )
}
