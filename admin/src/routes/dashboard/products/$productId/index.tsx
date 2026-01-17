import { getProductBySlug, Product, ProductVariant } from "@/api/products"
import { getImageUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil } from "lucide-react"
import { format } from "date-fns"

export const Route = createFileRoute("/dashboard/products/$productId/")({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductBySlug({ data: { slug: productId } }),
  })

  const product = data?.success ? data.data : null

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
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                {product.variants?.length || 0} variant(s) configured
              </CardDescription>
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
                          <TableCell className="text-right">{variant.stock_quantity}</TableCell>
                          <TableCell>
                            <Badge variant={variant.is_active ? "default" : "secondary"}>
                              {variant.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No variants configured</p>
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
                  {format(new Date(product.created_at), "PPpp")}
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Updated</span>
                <p className="font-medium">
                  {format(new Date(product.updated_at), "PPpp")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
