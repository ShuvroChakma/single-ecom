import { useState, useMemo, useEffect } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Check,
  Loader2,
} from "lucide-react"
import Header from "@/components/shared/Header/Header"
import Footer from "@/components/shared/Footer/Footer"
import { getProductById, getProductBySlug, getProducts, type Product, type ProductVariant } from "@/api/categories"
import { getImageUrl } from "@/api/client"
import { addToCart } from "@/api/cart"
import { addToWishlist, removeFromWishlist, checkWishlist } from "@/api/wishlist"
import { useAuth } from "@/hooks/useAuth"
import { useLoginModal } from "@/contexts/LoginModalContext"

export const Route = createFileRoute("/products/$slug")({
  component: ProductPage,
})

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Parse magic URL to extract product ID
 * URL pattern: /products/product-name-here-550e8400-e29b-41d4-a716-446655440000
 * The last 36 characters (UUID format) are the ID, rest is the slug for SEO
 */
function parseProductUrl(urlSlug: string): { id: string | null; slugPart: string } {
  // Check if the URL ends with a UUID (36 chars: 8-4-4-4-12)
  if (urlSlug.length > 37) {
    const possibleId = urlSlug.slice(-36)
    if (UUID_REGEX.test(possibleId)) {
      // Extract slug part (everything before the UUID, minus the trailing hyphen)
      const slugPart = urlSlug.slice(0, -37) // -36 for UUID, -1 for hyphen
      return { id: possibleId, slugPart }
    }
  }

  // Check if the whole thing is a UUID
  if (UUID_REGEX.test(urlSlug)) {
    return { id: urlSlug, slugPart: '' }
  }

  // No UUID found, treat as regular slug (backwards compatible)
  return { id: null, slugPart: urlSlug }
}

/**
 * Generate canonical URL for a product
 */
function generateProductUrl(product: Product): string {
  return `/products/${product.slug}-${product.id}`
}

function ProductPage() {
  const { slug: urlSlug } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const { showLoginModal } = useLoginModal()

  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Parse URL to extract ID
  const { id: productId, slugPart } = parseProductUrl(urlSlug)

  // Fetch product data - by ID if available, otherwise by slug
  const { data: productResponse, isLoading, error } = useQuery({
    queryKey: ["product", productId || urlSlug],
    queryFn: () => productId ? getProductById({ data: { id: productId } }) : getProductBySlug({ data: { slug: urlSlug } }),
    staleTime: 5 * 60 * 1000,
  })

  const product = productResponse?.success ? productResponse.data : null

  // Check if product is in wishlist
  const { data: wishlistCheck } = useQuery({
    queryKey: ["wishlist-check", product?.id],
    queryFn: () => checkWishlist({ data: { productId: product!.id } }),
    enabled: !!product?.id,
  })

  const isInWishlist = wishlistCheck?.success ? wishlistCheck.data?.in_wishlist ?? false : false
  const wishlistItemId = wishlistCheck?.success ? wishlistCheck.data?.item_id ?? null : null

  // Redirect to canonical URL if slug doesn't match
  useEffect(() => {
    if (product && productId) {
      const expectedSlug = `${product.slug}-${product.id}`
      if (urlSlug !== expectedSlug) {
        // Redirect to canonical URL without adding to history
        navigate({ to: `/products/${expectedSlug}`, replace: true })
      }
    }
  }, [product, productId, urlSlug, navigate])

  // Set default variant when product loads
  useMemo(() => {
    if (product?.variants?.length && !selectedVariant) {
      const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0]
      setSelectedVariant(defaultVariant)
    }
  }, [product, selectedVariant])

  // Fetch related products
  const { data: relatedResponse } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: () => getProducts({ data: { category_id: product?.category_id, per_page: 4 } }),
    enabled: !!product?.category_id,
    staleTime: 5 * 60 * 1000,
  })

  const relatedProducts = relatedResponse?.success
    ? relatedResponse.data.items.filter((p) => p.id !== product?.id).slice(0, 4)
    : []

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (data: { variant_id: string; quantity: number }) => addToCart({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })

  // Wishlist mutations
  const addWishlistMutation = useMutation({
    mutationFn: (data: { product_id: string; variant_id?: string }) => addToWishlist({ data: { product_id: data.product_id, variant_id: data.variant_id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-check", product?.id] })
      queryClient.invalidateQueries({ queryKey: ["wishlist"] })
    },
  })

  const removeWishlistMutation = useMutation({
    mutationFn: (itemId: string) => removeFromWishlist({ data: { itemId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-check", product?.id] })
      queryClient.invalidateQueries({ queryKey: ["wishlist"] })
    },
  })

  // Calculate price from variant
  const calculatePrice = (variant: ProductVariant | null) => {
    if (!variant) return 0
    return variant.net_weight * 100
  }

  const price = calculatePrice(selectedVariant)
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price)

  // Image navigation
  const images = product?.images || []
  const nextImage = () => setSelectedImage((prev) => (prev + 1) % images.length)
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    if (!isAuthenticated) {
      showLoginModal('Please login to add items to your cart', () => {
        addToCartMutation.mutate({ variant_id: selectedVariant.id, quantity })
      })
      return
    }
    addToCartMutation.mutate({ variant_id: selectedVariant.id, quantity })
  }

  const handleBuyNow = () => {
    if (!selectedVariant) return
    if (!isAuthenticated) {
      showLoginModal('Please login to purchase this item', () => {
        addToCartMutation.mutate({ variant_id: selectedVariant.id, quantity })
        navigate({ to: "/cart" })
      })
      return
    }
    handleAddToCart()
    navigate({ to: "/cart" })
  }

  const handleToggleWishlist = () => {
    if (!product) return
    if (!isAuthenticated) {
      showLoginModal('Please login to save items to your wishlist')
      return
    }
    if (isInWishlist && wishlistItemId) {
      removeWishlistMutation.mutate(wishlistItemId)
    } else {
      addWishlistMutation.mutate({
        product_id: product.id,
        variant_id: selectedVariant?.id,
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
              <div className="h-10 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-32 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link to="/" className="text-header hover:underline">
            Go back to home
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-header">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-header">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Left - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square">
                {/* Wishlist button */}
                <button
                  onClick={handleToggleWishlist}
                  disabled={addWishlistMutation.isPending || removeWishlistMutation.isPending}
                  className="absolute top-4 right-4 z-10 p-2.5 bg-white rounded-full shadow-md hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {(addWishlistMutation.isPending || removeWishlistMutation.isPending) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-5 h-5 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                    />
                  )}
                </button>

                {/* Share button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                  }}
                  className="absolute top-4 right-16 z-10 p-2.5 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Zoomable Image */}
                <div
                  className="w-full h-full cursor-crosshair"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  <img
                    src={getImageUrl(images[selectedImage], '/placeholder-product.jpg')}
                    alt={product.name}
                    className="w-full h-full object-contain p-8"
                    style={{
                      transform: isZoomed ? "scale(2)" : "scale(1)",
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                      transition: isZoomed ? "none" : "transform 0.3s ease",
                    }}
                  />
                </div>

                {/* Featured badge */}
                {product.is_featured && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-header text-white text-xs font-medium rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? "border-header ring-2 ring-header/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={getImageUrl(img, '/placeholder-product.jpg')}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Product Details */}
            <div className="space-y-6">
              {/* Title & SKU */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">SKU: {product.sku_base}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl lg:text-4xl font-bold text-header">{formattedPrice}</span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {selectedVariant && selectedVariant.stock_quantity > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      In Stock ({selectedVariant.stock_quantity} available)
                    </span>
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Variant Selection */}
              {product.variants && product.variants.length > 1 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Select Variant:</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants
                      .filter((v) => v.is_active)
                      .map((variant) => {
                        const variantLabel = [
                          variant.metal_type,
                          variant.metal_purity,
                          variant.size ? `Size ${variant.size}` : null,
                        ]
                          .filter(Boolean)
                          .join(" - ")

                        return (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              selectedVariant?.id === variant.id
                                ? "border-header bg-header/5 text-header"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {variantLabel || variant.sku}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(selectedVariant?.stock_quantity || 10, q + 1))
                    }
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || addToCartMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-header text-header rounded-lg font-semibold hover:bg-header/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
                  className="flex-1 px-6 py-3 bg-header text-white rounded-lg font-semibold hover:bg-header/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>

              {/* Success message */}
              {addToCartMutation.isSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Added to cart successfully!
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="w-6 h-6 text-header" />
                  <span className="text-xs text-gray-600">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="w-6 h-6 text-header" />
                  <span className="text-xs text-gray-600">Certified Quality</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="w-6 h-6 text-header" />
                  <span className="text-xs text-gray-600">Easy Returns</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Specifications */}
          {selectedVariant && (
            <div className="border-t p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Product Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU</span>
                      <span className="font-medium">{selectedVariant.sku}</span>
                    </div>
                    {product.gender && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender</span>
                        <span className="font-medium">{product.gender}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metal Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Metal Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedVariant.metal_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metal Type</span>
                        <span className="font-medium">{selectedVariant.metal_type}</span>
                      </div>
                    )}
                    {selectedVariant.metal_purity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purity</span>
                        <span className="font-medium">{selectedVariant.metal_purity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Weight Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Weight</span>
                      <span className="font-medium">{selectedVariant.gross_weight}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Weight</span>
                      <span className="font-medium">{selectedVariant.net_weight}g</span>
                    </div>
                    {selectedVariant.size && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size</span>
                        <span className="font-medium">{selectedVariant.size}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.slug}-${relatedProduct.id}`}
                  className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={getImageUrl(relatedProduct.images?.[0], '/placeholder-product.jpg')}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-header transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{relatedProduct.sku_base}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
