import { getCategoryImages, ImageUploadResponse } from "@/api/uploads"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { Image as ImageIcon, Loader2 } from "lucide-react"

interface ImageGalleryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (url: string) => void
}

export function ImageGalleryDialog({ open, onOpenChange, onSelect }: ImageGalleryDialogProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['category-images'],
        queryFn: () => getCategoryImages(),
        enabled: open,
    })

    console.log("Gallery Query State:", { isLoading, success: Array.isArray(data), error })

    // Data is now directly the items array
    const images = Array.isArray(data) ? data : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select Image</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
                            <p>Failed to load images</p>
                            <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 opacity-50" />
                            <p>No images found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {images.map((image: ImageUploadResponse) => (
                                <button
                                    key={image.filename}
                                    className="group relative aspect-square overflow-hidden rounded-lg border border-border transition-all hover:ring-2 hover:ring-primary"
                                    onClick={() => {
                                        onSelect(image.url)
                                        onOpenChange(false)
                                    }}
                                >
                                    <img
                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${image.url}`}
                                        alt={image.filename}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </div>
            </DialogContent >
        </Dialog >
    )
}
