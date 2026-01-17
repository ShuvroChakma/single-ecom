import {
  getProductBySlug,
  updateProduct,
  Product,
  ProductPayload,
  ProductVariantPayload,
  Gender,
  MakingChargeType,
} from "@/api/products"
import { getCategories, Category } from "@/api/categories"
import { getBrands, Brand } from "@/api/brands"
import { getMetals, Metal, Purity } from "@/api/metals"
import { getImageUrl } from "@/lib/utils"
import { ImageGalleryDialog } from "@/components/shared/image-gallery-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/products/$productId/edit/")({
  component: EditProductPage,
})

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "UNISEX", label: "Unisex" },
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "KIDS", label: "Kids" },
]

const MAKING_CHARGE_OPTIONS: { value: MakingChargeType; label: string }[] = [
  { value: "FIXED_PER_GRAM", label: "Fixed Per Gram" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FLAT", label: "Flat Rate" },
]

const METAL_COLORS = ["yellow", "white", "rose"]

interface VariantFormData {
  id: string
  originalId?: string // Track original variant ID for updates
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

function createEmptyVariant(): VariantFormData {
  return {
    id: crypto.randomUUID(),
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
}

function EditProductPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantFormData[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch product data
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductBySlug({ data: { slug: productId } }),
  })

  const product = productData?.success ? productData.data : null

  // Fetch categories for combobox
  const fetchCategories = useCallback(async (query: string) => {
    const result = await getCategories({ data: { search: query, limit: 20 } })
    if (result.success) {
      return result.data.items.map((cat: Category) => ({
        value: cat.id,
        label: cat.name,
      }))
    }
    return []
  }, [])

  // Fetch brands for combobox
  const fetchBrands = useCallback(async (query: string) => {
    const result = await getBrands()
    if (result.success) {
      const filtered = query
        ? result.data.filter((b: Brand) =>
            b.name.toLowerCase().includes(query.toLowerCase())
          )
        : result.data
      return filtered.map((brand: Brand) => ({
        value: brand.id,
        label: brand.name,
      }))
    }
    return []
  }, [])

  // Fetch metals for variant form
  const { data: metalsData } = useQuery({
    queryKey: ["metals"],
    queryFn: () => getMetals(),
  })

  const metals = metalsData?.success ? metalsData.data : []

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; product: Partial<ProductPayload> }) =>
      updateProduct({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      toast.success("Product updated successfully")
      navigate({ to: "/dashboard/products" })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product")
    },
  })

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      sku_base: "",
      description: "",
      category_id: "",
      brand_id: "",
      gender: "UNISEX" as Gender,
      base_making_charge_type: "FIXED_PER_GRAM" as MakingChargeType,
      base_making_charge_value: "0",
      tax_code: "",
      is_active: true,
      is_featured: false,
    },
    onSubmit: async ({ value }) => {
      if (!product) return

      const payload: Partial<ProductPayload> = {
        name: value.name,
        slug: value.slug,
        sku_base: value.sku_base,
        description: value.description || null,
        category_id: value.category_id,
        brand_id: value.brand_id || null,
        gender: value.gender,
        base_making_charge_type: value.base_making_charge_type,
        base_making_charge_value: parseFloat(value.base_making_charge_value) || 0,
        tax_code: value.tax_code || null,
        is_active: value.is_active,
        is_featured: value.is_featured,
        images: images,
      }

      await updateMutation.mutateAsync({ id: product.id, product: payload })
    },
  })

  // Initialize form with product data
  useEffect(() => {
    if (product && !isInitialized) {
      form.setFieldValue("name", product.name || "")
      form.setFieldValue("slug", product.slug || "")
      form.setFieldValue("sku_base", product.sku_base || "")
      form.setFieldValue("description", product.description || "")
      form.setFieldValue("category_id", product.category_id || "")
      form.setFieldValue("brand_id", product.brand_id || "")
      form.setFieldValue("gender", (product.gender || "UNISEX") as Gender)
      form.setFieldValue(
        "base_making_charge_type",
        (product.base_making_charge_type || "FIXED_PER_GRAM") as MakingChargeType
      )
      form.setFieldValue(
        "base_making_charge_value",
        product.base_making_charge_value?.toString() || "0"
      )
      form.setFieldValue("tax_code", product.tax_code || "")
      form.setFieldValue("is_active", product.is_active ?? true)
      form.setFieldValue("is_featured", product.is_featured ?? false)

      setImages(product.images || [])

      // Initialize variants
      if (product.variants) {
        setVariants(
          product.variants.map((v) => ({
            id: crypto.randomUUID(),
            originalId: v.id,
            sku: v.sku,
            metal_type: v.metal_type,
            metal_purity: v.metal_purity,
            metal_color: v.metal_color,
            size: v.size || "",
            gross_weight: v.gross_weight?.toString() || "",
            net_weight: v.net_weight?.toString() || "",
            stock_quantity: v.stock_quantity?.toString() || "0",
            is_default: v.is_default,
            is_active: v.is_active,
          }))
        )
      }

      setIsInitialized(true)
    }
  }, [product, isInitialized])

  const handleAddImage = (url: string) => {
    setImages((prev) => [...prev, url])
    setIsGalleryOpen(false)
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()])
  }

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  const handleVariantChange = (
    id: string,
    field: keyof VariantFormData,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v

        if (field === "metal_type") {
          return { ...v, [field]: value, metal_purity: "" }
        }

        return { ...v, [field]: value }
      })
    )

    if (field === "is_default" && value === true) {
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          is_default: v.id === id,
        }))
      )
    }
  }

  const getPuritiesForMetal = (metalCode: string): Purity[] => {
    const metal = metals.find((m: Metal) => m.code === metalCode)
    return metal?.purities || []
  }

  const isPending = updateMutation.isPending

  if (isLoadingProduct) {
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
            <Skeleton className="h-32" />
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product details for "{product.name}"
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the product name, SKU, and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Name is required" : undefined,
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Product name"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                />

                <form.Field
                  name="sku_base"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "SKU is required" : undefined,
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="sku_base">Base SKU *</Label>
                      <Input
                        id="sku_base"
                        placeholder="e.g. RING-001"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value.toUpperCase())
                        }
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Slug is required" : undefined,
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="product-slug"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Product description"
                      rows={4}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Manage product images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="relative h-24 w-24 rounded-lg border overflow-hidden group"
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`Product image ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/96x96?text=IMG"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5">
                        Main
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="h-24 w-24"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">Add</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Variants Info */}
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Product has {variants.length} variant(s). Manage variants separately after saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <p className="text-muted-foreground text-sm">No variants configured.</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{variant.sku}</p>
                        <p className="text-sm text-muted-foreground">
                          {variant.metal_type} {variant.metal_purity} - {variant.metal_color}
                          {variant.size && ` - Size: ${variant.size}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {variant.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                        {!variant.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categorization */}
          <Card>
            <CardHeader>
              <CardTitle>Categorization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="category_id"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Category is required" : undefined,
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <AsyncCombobox
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      fetchOptions={fetchCategories}
                      placeholder="Select category..."
                      searchPlaceholder="Search categories..."
                      emptyText="No categories found."
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="brand_id"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <AsyncCombobox
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      fetchOptions={fetchBrands}
                      placeholder="Select brand..."
                      searchPlaceholder="Search brands..."
                      emptyText="No brands found."
                    />
                  </div>
                )}
              />

              <form.Field
                name="gender"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as Gender)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Making Charges */}
          <Card>
            <CardHeader>
              <CardTitle>Making Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="base_making_charge_type"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Charge Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as MakingChargeType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAKING_CHARGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <form.Field
                name="base_making_charge_value"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Charge Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              />

              <form.Field
                name="tax_code"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Tax Code (HSN/SAC)</Label>
                    <Input
                      placeholder="e.g. 7113"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="is_active"
                children={(field) => (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              />

              <form.Field
                name="is_featured"
                children={(field) => (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured">Featured</Label>
                    <Switch
                      id="is_featured"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Product
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/dashboard/products" })}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>

      <ImageGalleryDialog
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        onSelect={handleAddImage}
      />
    </div>
  )
}
