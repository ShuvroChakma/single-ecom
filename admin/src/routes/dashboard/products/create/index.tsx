import {
  createProduct,
  ProductPayload,
  ProductVariantPayload,
  Gender,
  MakingChargeType,
} from "@/api/products"
import { getCategories, Category } from "@/api/categories"
import { getBrands, Brand } from "@/api/brands"
import { getMetals, Metal, Purity } from "@/api/metals"
import {
  getAttributeGroups,
  setProductAttribute,
  AttributeGroupWithAttributes,
  Attribute,
  ProductAttributeValuePayload,
} from "@/api/attributes"
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
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/products/create/")({
  component: CreateProductPage,
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

interface AttributeFormData {
  attribute_id: string
  value: string
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

function CreateProductPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantFormData[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})

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

  // Fetch metals for combobox
  const fetchMetals = useCallback(async (query: string) => {
    const result = await getMetals()
    if (result.success) {
      const filtered = query
        ? result.data.filter((m: Metal) =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.code.toLowerCase().includes(query.toLowerCase())
          )
        : result.data
      return filtered.map((metal: Metal) => ({
        value: metal.code,
        label: metal.name,
      }))
    }
    return []
  }, [])

  // Fetch metals for variant form (need full data for purities)
  const { data: metalsData } = useQuery({
    queryKey: ["metals"],
    queryFn: () => getMetals(),
  })

  const metals = metalsData?.success ? metalsData.data : []

  // Fetch attribute groups
  const { data: attributeGroupsData } = useQuery({
    queryKey: ["attribute-groups"],
    queryFn: () => getAttributeGroups(),
  })

  const attributeGroups: AttributeGroupWithAttributes[] = attributeGroupsData?.success
    ? attributeGroupsData.data
    : []

  const createMutation = useMutation({
    mutationFn: async (data: ProductPayload) => {
      // Create product first
      const result = await createProduct({ data })
      if (!result.success) throw new Error("Failed to create product")

      // Set attribute values
      const productId = result.data.id
      const attrPromises = Object.entries(attributeValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([attributeId, value]) =>
          setProductAttribute({
            data: {
              productId,
              attribute: { attribute_id: attributeId, value },
            },
          })
        )

      if (attrPromises.length > 0) {
        await Promise.all(attrPromises)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")
      navigate({ to: "/dashboard/products" })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product")
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
      // Convert variants to payload format
      const variantPayloads: ProductVariantPayload[] = variants
        .filter((v) => v.sku && v.metal_type && v.metal_purity)
        .map((v) => ({
          sku: v.sku,
          metal_type: v.metal_type,
          metal_purity: v.metal_purity,
          metal_color: v.metal_color,
          size: v.size || null,
          gross_weight: parseFloat(v.gross_weight) || 0,
          net_weight: parseFloat(v.net_weight) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          is_default: v.is_default,
          is_active: v.is_active,
        }))

      const payload: ProductPayload = {
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
        variants: variantPayloads,
      }

      await createMutation.mutateAsync(payload)
    },
  })

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

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

        // If changing metal_type, reset purity
        if (field === "metal_type") {
          return { ...v, [field]: value, metal_purity: "" }
        }

        // If setting is_default to true, set others to false
        if (field === "is_default" && value === true) {
          return { ...v, [field]: value }
        }

        return { ...v, [field]: value }
      })
    )

    // Handle is_default toggle - ensure only one is default
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

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }))
  }

  const renderAttributeInput = (attribute: Attribute) => {
    const value = attributeValues[attribute.id] || ""

    switch (attribute.type) {
      case "SELECT":
        return (
          <Select value={value} onValueChange={(v) => handleAttributeChange(attribute.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "MULTI_SELECT":
        return (
          <Select value={value} onValueChange={(v) => handleAttributeChange(attribute.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "BOOLEAN":
        return (
          <Select value={value} onValueChange={(v) => handleAttributeChange(attribute.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      case "NUMBER":
        return (
          <Input
            type="number"
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
            value={value}
            onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
          />
        )
      default:
        return (
          <Input
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
            value={value}
            onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
          />
        )
    }
  }

  const isPending = createMutation.isPending

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
          <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your catalog
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
                Enter the product name, SKU, and description
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
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          form.setFieldValue("slug", generateSlug(e.target.value))
                        }}
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
                Add product images from the gallery
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

          {/* Variants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variants</CardTitle>
                  <CardDescription>
                    Add product variants with different metal types and sizes
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No variants added yet.</p>
                  <p className="text-sm">Click "Add Variant" to create product variants.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="space-y-4">
                      {index > 0 && <Separator />}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Variant {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(variant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Variant SKU *</Label>
                          <Input
                            placeholder="e.g. RING-001-22K-Y"
                            value={variant.sku}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "sku", e.target.value.toUpperCase())
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Metal Type *</Label>
                          <AsyncCombobox
                            value={variant.metal_type}
                            onValueChange={(value) =>
                              handleVariantChange(variant.id, "metal_type", value)
                            }
                            fetchOptions={fetchMetals}
                            placeholder="Select metal..."
                            searchPlaceholder="Search metals..."
                            emptyText="No metals found."
                            initialOption={
                              variant.metal_type
                                ? {
                                    value: variant.metal_type,
                                    label: metals.find((m: Metal) => m.code === variant.metal_type)?.name || variant.metal_type,
                                  }
                                : undefined
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Purity *</Label>
                          <Select
                            value={variant.metal_purity}
                            onValueChange={(value) =>
                              handleVariantChange(variant.id, "metal_purity", value)
                            }
                            disabled={!variant.metal_type}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select purity" />
                            </SelectTrigger>
                            <SelectContent>
                              {getPuritiesForMetal(variant.metal_type).map((purity: Purity) => (
                                <SelectItem key={purity.id} value={purity.code}>
                                  {purity.name} ({purity.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Metal Color</Label>
                          <Select
                            value={variant.metal_color}
                            onValueChange={(value) =>
                              handleVariantChange(variant.id, "metal_color", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {METAL_COLORS.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color.charAt(0).toUpperCase() + color.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Size</Label>
                          <Input
                            placeholder="e.g. 16, M, 7.5"
                            value={variant.size}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "size", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Gross Weight (g) *</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            value={variant.gross_weight}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "gross_weight", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Net Weight (g) *</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            value={variant.net_weight}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "net_weight", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Stock Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock_quantity}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "stock_quantity", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`variant-default-${variant.id}`}
                            checked={variant.is_default}
                            onCheckedChange={(checked) =>
                              handleVariantChange(variant.id, "is_default", checked)
                            }
                          />
                          <Label htmlFor={`variant-default-${variant.id}`}>Default Variant</Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id={`variant-active-${variant.id}`}
                            checked={variant.is_active}
                            onCheckedChange={(checked) =>
                              handleVariantChange(variant.id, "is_active", checked)
                            }
                          />
                          <Label htmlFor={`variant-active-${variant.id}`}>Active</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attributes */}
          {attributeGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
                <CardDescription>
                  Set product attributes for filtering and display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {attributeGroups.map((group) => (
                  <div key={group.id} className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {group.name}
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.attributes
                        .filter((attr) => attr.is_active)
                        .map((attribute) => (
                          <div key={attribute.id} className="space-y-2">
                            <Label>
                              {attribute.name}
                              {attribute.is_required && " *"}
                            </Label>
                            {renderAttributeInput(attribute)}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
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
                      <SelectTrigger className="w-full">
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
                      <SelectTrigger className="w-full">
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
              Create Product
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
