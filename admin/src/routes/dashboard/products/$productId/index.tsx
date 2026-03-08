import { useState } from "react"
import {
  getProductBySlug,
  Product,
  ProductVariant,
  ProductVariantPayload,
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/api/products"
import { getMetals, Metal } from "@/api/metals"
import { getImageUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Trash2, Loader2, Package } from "lucide-react"
import { fmtDateTimeFull } from "@/lib/date"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/products/$productId/")({
  component: ProductDetailPage,
})

const METAL_COLORS = ["yellow", "white", "rose"]

interface VariantFormData {
  sku: string
  metal_type: string
  metal_purity: string
  metal_color: string
  size: string
  gross_weight: string
  net_weight: string
  stock_quantity: string
  is_default: boolean
  is_active: boolean
}

const defaultVariantForm: VariantFormData = {
  sku: "",
  metal_type: "",
  metal_purity: "",
  metal_color: "yellow",
  size: "",
  gross_weight: "",
  net_weight: "",
  stock_quantity: "0",
  is_default: false,
  is_active: true,
}

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const queryClient = useQueryClient()

  // Dialog states
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null)
  const [variantForm, setVariantForm] = useState<VariantFormData>(defaultVariantForm)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch product
  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductBySlug({ data: { slug: productId } }),
  })

  // Fetch metals for dropdown
  const { data: metalsData } = useQuery({
    queryKey: ["metals"],
    queryFn: () => getMetals(),
  })

  const product = data?.success ? data.data : null
  const metals: Metal[] = metalsData?.success ? metalsData.data : []

  // Get purities for selected metal
  const selectedMetal = metals.find((m) => m.code === variantForm.metal_type)
  const purities = selectedMetal?.purities?.filter((p) => p.is_active) || []

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (variant: ProductVariantPayload) =>
      createVariant({ data: { productId: product!.id, variant } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Variant created successfully")
        queryClient.invalidateQueries({ queryKey: ["product", productId] })
        closeVariantDialog()
      } else {
        toast.error(res.message || "Failed to create variant")
      }
    },
    onError: () => toast.error("Failed to create variant"),
  })

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, variant }: { variantId: string; variant: Partial<ProductVariantPayload> }) =>
      updateVariant({ data: { variantId, variant } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Variant updated successfully")
        queryClient.invalidateQueries({ queryKey: ["product", productId] })
        closeVariantDialog()
      } else {
        toast.error(res.message || "Failed to update variant")
      }
    },
    onError: () => toast.error("Failed to update variant"),
  })

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) => deleteVariant({ data: { variantId } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Variant deleted successfully")
        queryClient.invalidateQueries({ queryKey: ["product", productId] })
        setDeleteDialogOpen(false)
        setDeletingVariant(null)
        setDeleteError(null)
      } else {
        setDeleteError(res.message || "Failed to delete variant")
      }
    },
    onError: (error: any) => setDeleteError(error.message || "Failed to delete variant"),
  })

  // Toggle variant active mutation
  const toggleVariantActiveMutation = useMutation({
    mutationFn: ({ variantId, is_active }: { variantId: string; is_active: boolean }) =>
      updateVariant({ data: { variantId, variant: { is_active } } }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      toast.success(vars.is_active ? "Variant activated" : "Variant deactivated")
    },
    onError: (error: any) => toast.error(error.message || "Failed to update variant status"),
  })

  const openAddVariant = () => {
    setEditingVariant(null)
    setVariantForm({
      ...defaultVariantForm,
      sku: `${product?.sku_base}-`,
    })
    setVariantDialogOpen(true)
  }

  const openEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantForm({
      sku: variant.sku,
      metal_type: variant.metal_type,
      metal_purity: variant.metal_purity,
      metal_color: variant.metal_color,
      size: variant.size || "",
      gross_weight: variant.gross_weight.toString(),
      net_weight: variant.net_weight.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      is_default: variant.is_default,
      is_active: variant.is_active,
    })
    setVariantDialogOpen(true)
  }

  const openDeleteVariant = (variant: ProductVariant) => {
    setDeletingVariant(variant)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const closeVariantDialog = () => {
    setVariantDialogOpen(false)
    setEditingVariant(null)
    setVariantForm(defaultVariantForm)
  }

  const handleVariantSubmit = () => {
    const payload: ProductVariantPayload = {
      sku: variantForm.sku,
      metal_type: variantForm.metal_type,
      metal_purity: variantForm.metal_purity,
      metal_color: variantForm.metal_color,
      size: variantForm.size || null,
      gross_weight: parseFloat(variantForm.gross_weight) || 0,
      net_weight: parseFloat(variantForm.net_weight) || 0,
      stock_quantity: parseInt(variantForm.stock_quantity) || 0,
      is_default: variantForm.is_default,
      is_active: variantForm.is_active,
    }

    if (editingVariant) {
      updateVariantMutation.mutate({ variantId: editingVariant.id, variant: payload })
    } else {
      createVariantMutation.mutate(payload)
    }
  }

  const handleDeleteVariant = () => {
    if (deletingVariant) {
      setDeleteError(null)
      deleteVariantMutation.mutate(deletingVariant.id)
    }
  }

  const handleDeactivateVariantAndClose = () => {
    if (deletingVariant) {
      toggleVariantActiveMutation.mutate({ variantId: deletingVariant.id, is_active: false })
      setDeleteDialogOpen(false)
      setDeletingVariant(null)
      setDeleteError(null)
    }
  }

  const isSubmitting = createVariantMutation.isPending || updateVariantMutation.isPending

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="text-muted-foreground mt-2">
          The product you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/products">Back to Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku_base}</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/dashboard/products/$productId/edit" params={{ productId }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {product.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative h-32 w-32 rounded-lg border overflow-hidden"
                    >
                      <img
                        src={getImageUrl(url)}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/128x128?text=IMG"
                        }}
                      />
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No images uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description ? (
                <p className="whitespace-pre-wrap">{product.description}</p>
              ) : (
                <p className="text-muted-foreground">No description</p>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  {product.variants?.length || 0} variant(s) configured
                </CardDescription>
              </div>
              <Button onClick={openAddVariant} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </CardHeader>
            <CardContent>
              {product.variants && product.variants.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Metal</TableHead>
                        <TableHead>Purity</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Net Weight</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant: ProductVariant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">
                            {variant.sku}
                            {variant.is_default && (
                              <Badge variant="outline" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{variant.metal_type}</TableCell>
                          <TableCell>{variant.metal_purity}</TableCell>
                          <TableCell className="capitalize">{variant.metal_color}</TableCell>
                          <TableCell>{variant.size || "-"}</TableCell>
                          <TableCell className="text-right">{variant.net_weight}g</TableCell>
                          <TableCell className="text-right">
                            <span className={variant.stock_quantity <= 0 ? "text-red-600 font-semibold" : variant.stock_quantity <= 5 ? "text-yellow-600 font-semibold" : ""}>
                              {variant.stock_quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant.is_active ? "default" : "secondary"}>
                              {variant.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVariantActiveMutation.mutate({ variantId: variant.id, is_active: !variant.is_active })}
                                title={variant.is_active ? "Deactivate variant" : "Activate variant"}
                                className={variant.is_active ? "text-muted-foreground hover:text-foreground" : "text-green-600 hover:text-green-700"}
                              >
                                {variant.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditVariant(variant)}
                                title="Edit variant"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteVariant(variant)}
                                title="Delete variant"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No variants configured</p>
                  <Button onClick={openAddVariant} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Variant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active</span>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Featured</span>
                <Badge variant={product.is_featured ? "default" : "secondary"}>
                  {product.is_featured ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stock Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Stock</span>
                <span className="font-semibold">
                  {product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Out of Stock</span>
                <span className={`font-semibold ${(product.variants?.filter((v) => v.stock_quantity <= 0).length || 0) > 0 ? "text-red-600" : ""}`}>
                  {product.variants?.filter((v) => v.stock_quantity <= 0).length || 0} variants
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Low Stock (&le;5)</span>
                <span className={`font-semibold ${(product.variants?.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= 5).length || 0) > 0 ? "text-yellow-600" : ""}`}>
                  {product.variants?.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= 5).length || 0} variants
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Gender</span>
                <p className="font-medium">{product.gender}</p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Making Charge</span>
                <p className="font-medium">
                  {product.base_making_charge_type === "PERCENTAGE"
                    ? `${product.base_making_charge_value}%`
                    : product.base_making_charge_type === "FIXED_PER_GRAM"
                    ? `${product.base_making_charge_value}/gram`
                    : `${product.base_making_charge_value} (flat)`}
                </p>
              </div>
              {product.tax_code && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Tax Code (HSN/SAC)</span>
                    <p className="font-medium">{product.tax_code}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Slug</span>
                <p className="font-medium font-mono text-sm">{product.slug}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Created</span>
                <p className="font-medium">
                  {fmtDateTimeFull(product.created_at)}
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Updated</span>
                <p className="font-medium">
                  {fmtDateTimeFull(product.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add New Variant"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Update the variant details including stock quantity."
                : "Add a new variant to this product."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* SKU */}
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={variantForm.sku}
                onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                placeholder="Enter variant SKU"
              />
            </div>

            {/* Metal Type & Purity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Metal Type *</Label>
                <Select
                  value={variantForm.metal_type}
                  onValueChange={(value) =>
                    setVariantForm({ ...variantForm, metal_type: value, metal_purity: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal" />
                  </SelectTrigger>
                  <SelectContent>
                    {metals
                      .filter((m) => m.is_active)
                      .map((metal) => (
                        <SelectItem key={metal.id} value={metal.code}>
                          {metal.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Purity *</Label>
                <Select
                  value={variantForm.metal_purity}
                  onValueChange={(value) =>
                    setVariantForm({ ...variantForm, metal_purity: value })
                  }
                  disabled={!variantForm.metal_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purity" />
                  </SelectTrigger>
                  <SelectContent>
                    {purities.map((purity) => (
                      <SelectItem key={purity.id} value={purity.code}>
                        {purity.name} ({purity.fineness})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metal Color & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Metal Color *</Label>
                <Select
                  value={variantForm.metal_color}
                  onValueChange={(value) =>
                    setVariantForm({ ...variantForm, metal_color: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {METAL_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <span className="capitalize">{color}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Size (optional)</Label>
                <Input
                  id="size"
                  value={variantForm.size}
                  onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                  placeholder="e.g., 7, 8, M, L"
                />
              </div>
            </div>

            {/* Weights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gross_weight">Gross Weight (g) *</Label>
                <Input
                  id="gross_weight"
                  type="number"
                  step="0.001"
                  min="0"
                  value={variantForm.gross_weight}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, gross_weight: e.target.value })
                  }
                  placeholder="0.000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="net_weight">Net Weight (g) *</Label>
                <Input
                  id="net_weight"
                  type="number"
                  step="0.001"
                  min="0"
                  value={variantForm.net_weight}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, net_weight: e.target.value })
                  }
                  placeholder="0.000"
                />
              </div>
            </div>

            {/* Stock Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={variantForm.stock_quantity}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, stock_quantity: e.target.value })
                }
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Current available stock for this variant
              </p>
            </div>

            {/* Switches */}
            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={variantForm.is_default}
                  onCheckedChange={(checked) =>
                    setVariantForm({ ...variantForm, is_default: checked })
                  }
                />
                <Label htmlFor="is_default">Default Variant</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={variantForm.is_active}
                  onCheckedChange={(checked) =>
                    setVariantForm({ ...variantForm, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeVariantDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleVariantSubmit}
              disabled={
                isSubmitting ||
                !variantForm.sku ||
                !variantForm.metal_type ||
                !variantForm.metal_purity ||
                !variantForm.gross_weight ||
                !variantForm.net_weight
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVariant ? "Update Variant" : "Add Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setDeleteError(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete variant{" "}
              <strong>{deletingVariant?.sku}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <p className="font-medium mb-1">Cannot delete</p>
              <p>{deleteError}</p>
            </div>
          )}
          <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel disabled={deleteVariantMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            {deleteError && deletingVariant?.is_active && (
              <Button
                variant="outline"
                onClick={handleDeactivateVariantAndClose}
                disabled={toggleVariantActiveMutation.isPending}
              >
                {toggleVariantActiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Inactive Instead
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDeleteVariant}
              disabled={deleteVariantMutation.isPending}
            >
              {deleteVariantMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
