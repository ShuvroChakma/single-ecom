import { getMediaImages, ImageUploadResponse, PaginatedMediaResponse, uploadMediaImage } from "@/api/uploads"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { FolderOpen, Image as ImageIcon, Loader2, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface ImageGalleryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (url: string) => void
}

export function ImageGalleryDialog({ open, onOpenChange, onSelect }: ImageGalleryDialogProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [isUploading, setIsUploading] = useState(false)
    const [activeTab, setActiveTab] = useState("gallery")
    const scrollRef = useRef<HTMLDivElement>(null)

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['media-images'],
        queryFn: async ({ pageParam = 1 }) => {
            const result = await getMediaImages({ data: { page: pageParam, limit: 20 } })
            return result as PaginatedMediaResponse
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.has_next) {
                return lastPage.page + 1
            }
            return undefined
        },
        initialPageParam: 1,
        enabled: open,
    })

    // Flatten all pages into a single array
    const images = data?.pages.flatMap(page => page.items) || []

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (!scrollRef.current || isFetchingNextPage || !hasNextPage) return

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        // Load more when user scrolls within 100px of bottom
        if (scrollHeight - scrollTop - clientHeight < 100) {
            fetchNextPage()
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage])

    // Attach scroll listener
    useEffect(() => {
        const scrollEl = scrollRef.current
        if (scrollEl) {
            scrollEl.addEventListener('scroll', handleScroll)
            return () => scrollEl.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const result = await uploadMediaImage(file, token || undefined)
            await refetch()
            toast.success("Image uploaded successfully")
            // Auto-select the uploaded image
            onSelect(result.url)
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Media Library
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gallery" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Gallery
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="gallery" className="mt-4">
                        <div
                            ref={scrollRef}
                            className="h-[400px] w-full overflow-y-auto rounded-md border p-4"
                        >
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
                                        <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                                            <ImageIcon className="h-12 w-12 opacity-50" />
                                    <p>No images in library</p>
                                    <Button variant="outline" onClick={() => setActiveTab("upload")}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload your first image
                                    </Button>
                                </div>
                            ) : (
                                            <>
                                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                                    {images.map((image: ImageUploadResponse, index: number) => (
                                                        <button
                                                key={`${image.filename}-${index}`}
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
                                                {isFetchingNextPage && (
                                                    <div className="flex justify-center py-4">
                                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                    </div>
                                                )}
                                    {!hasNextPage && images.length > 0 && (
                                        <p className="text-center text-sm text-muted-foreground py-4">
                                            All images loaded
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4">
                        <div className="relative flex h-[400px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={handleUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                    <Upload className="h-12 w-12" />
                                    <div className="text-center">
                                        <p className="font-medium">Drop file here or click to upload</p>
                                        <p className="text-sm">Supports: JPG, PNG, WebP, GIF (max 5MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
