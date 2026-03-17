import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Truck,
} from "lucide-react"
import {
  FacebookIcon, FacebookShareButton,
  TelegramIcon, TelegramShareButton,
  TwitterShareButton, WhatsappIcon,
  WhatsappShareButton, XIcon,
} from "react-share"
import type {Product, ProductVariant} from "@/api/categories";
import type {PriceBreakdown} from "@/api/products";
import Header from "@/components/shared/Header/Header"
import Footer from "@/components/shared/Footer/Footer"
import {   getProductById, getProductBySlug, getProducts } from "@/api/categories"
import {  getAttributeGroups, getProductAttributes, getProductPricing } from "@/api/products"
import { getImageUrl } from "@/api/client"
import { addToCart } from "@/api/cart"
import { addToWishlist, checkWishlist, removeFromWishlist } from "@/api/wishlist"
import { useAuth } from "@/hooks/useAuth"
import { useLoginModal } from "@/contexts/LoginModalContext"

// UUID regex pattern — must be defined before Route (used in loader)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseProductUrl(urlSlug: string): { id: string | null; slugPart: string } {
  if (urlSlug.length > 37) {
    const possibleId = urlSlug.slice(-36)
    if (UUID_REGEX.test(possibleId)) {
      return { id: possibleId, slugPart: urlSlug.slice(0, -37) }
    }
  }
  if (UUID_REGEX.test(urlSlug)) return { id: urlSlug, slugPart: '' }
  return { id: null, slugPart: urlSlug }
}

function ProductPending() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
    </div>
  )
}

function ProductError() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-4xl font-bold text-red-400 mb-3">Oops</p>
      <p className="text-gray-500 mb-6">We couldn't load this product. Please try again.</p>
      <button
        onClick={() => router.history.back()}
        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        Go Back
      </button>
    </div>
  )
}

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const { id: productId } = parseProductUrl(params.slug)
    const queryKey = ["product", productId || params.slug]
    try {
      await queryClient.ensureQueryData({
        queryKey,
        queryFn: () =>
          productId
            ? getProductById({ data: { id: productId } })
            : getProductBySlug({ data: { slug: params.slug } }),
        staleTime: 5 * 60 * 1000,
      })
    } catch {
      // Non-fatal: component will show error state
    }
    const cached = queryClient.getQueryData<any>(queryKey)
    const product = cached?.success ? cached.data : null
    return { productId, slug: params.slug, product }
  },
  pendingComponent: ProductPending,
  errorComponent: ProductError,
  head: ({ loaderData }) => {
    const product = loaderData?.product
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://nazumeahjewellers.com'
    if (!product) return { meta: [{ title: 'Product | Nazu Meah Jewellers' }] }
    const title = product.meta_title || `${product.name} | Nazu Meah Jewellers`
    const description = product.meta_description || product.description?.slice(0, 160) || `Buy ${product.name} at Nazu Meah Jewellers`
    const image = product.images?.[0] ? getImageUrl(product.images[0]) : ''
    const canonicalUrl = `${siteUrl}/products/${product.slug}-${product.id}`

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      sku: product.sku_base,
      url: canonicalUrl,
      ...(image ? { image } : {}),
      brand: { '@type': 'Brand', name: 'Nazu Meah Jewellers' },
      offers: {
        '@type': 'Offer',
        availability: product.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        priceCurrency: 'BDT',
        seller: { '@type': 'Organization', name: 'Nazu Meah Jewellers' },
      },
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
        { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
      ],
    }

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'product' },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(productSchema) },
        { type: 'application/ld+json', children: JSON.stringify(breadcrumbSchema) },
      ],
    }
  },
  component: ProductPage,
})

/**
 * Generate canonical URL for a product
 */
function generateProductUrl(product: Product): string {
  return `/products/${product.slug}-${product.id}`
}

function ProductPage() {
  const { slug: urlSlug } = Route.useParams()
  const loaderData = Route.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const { showLoginModal } = useLoginModal()

  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const [shareMenuPos, setShareMenuPos] = useState({ top: 0, right: 0 })

  // Parse URL to extract ID — loaderData provides these to avoid re-parsing
  const productId = loaderData?.productId ?? parseProductUrl(urlSlug).id

  // Loader already populated the cache via ensureQueryData — this read from cache only
  const { data: productResponse, isLoading, error } = useQuery({
    queryKey: ["product", productId || urlSlug],
    queryFn: () => productId ? getProductById({ data: { id: productId } }) : getProductBySlug({ data: { slug: urlSlug } }),
    staleTime: 5 * 60 * 1000,
  })

  const product = productResponse?.success ? productResponse.data : null

  // Check if product is in wishlist (only when authenticated)
  const { data: wishlistCheck } = useQuery({
    queryKey: ["wishlist-check", product?.id],
    queryFn: () => checkWishlist({ data: { productId: product!.id } }),
    enabled: !!product?.id && isAuthenticated,
  })

  const isInWishlist = wishlistCheck?.success ? wishlistCheck.data?.in_wishlist ?? false : false
  const wishlistItemId = wishlistCheck?.success ? wishlistCheck.data?.item_id ?? null : null

  // Fetch real pricing for all variants
  const { data: pricingResponse } = useQuery({
    queryKey: ["product-pricing", product?.id],
    queryFn: () => getProductPricing({ data: { productId: product!.id } }),
    enabled: !!product?.id,
  })

  const variantPricing: PriceBreakdown | null = useMemo(() => {
    if (!pricingResponse?.success || !selectedVariant) return null
    const match = pricingResponse.data.variants.find(v => v.variant_id === selectedVariant.id)
    return match?.pricing ?? null
  }, [pricingResponse, selectedVariant])

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

  // Set default variant when product loads or changes
  useEffect(() => {
    if (product?.variants?.length) {
      const defaultVariant =
        product.variants.find((v) => v.is_default && v.is_active) ||
        product.variants.find((v) => v.is_active) ||
        product.variants[0]
      setSelectedVariant(defaultVariant)
    } else if (product) {
      setSelectedVariant(null)
    }
  }, [product?.id])

  // Close share menu on outside click
  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const inDropdown = shareRef.current?.contains(target)
      const inButton = shareButtonRef.current?.contains(target)
      if (!inDropdown && !inButton) setShowShareMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  // Fetch product attributes (EAV)
  const { data: attributesResponse } = useQuery({
    queryKey: ["product-attributes", product?.id],
    queryFn: () => getProductAttributes({ data: { productId: product!.id } }),
    enabled: !!product?.id,
  })

  const { data: attrGroupsResponse } = useQuery({
    queryKey: ["attribute-groups"],
    queryFn: () => getAttributeGroups(),
    staleTime: 10 * 60 * 1000,
    enabled: !!product?.id,
  })

  // Group attributes by group name
  const attributeGroups = useMemo(() => {
    const values = attributesResponse?.success ? attributesResponse.data : []
    const groups = attrGroupsResponse?.success ? attrGroupsResponse.data : []
    const groupMap: Record<string, string> = {}
    for (const g of groups) groupMap[g.id] = g.name

    const result: Array<{ groupName: string; sortOrder: number; items: Array<{ name: string; value: string }> }> = []
    const seen: Record<string, number> = {}

    for (const item of values) {
      if (!item.attribute) continue
      const groupId = item.attribute.group_id
      const groupName = groupMap[groupId] || 'Details'
      if (seen[groupId] === undefined) {
        const g = groups.find(g => g.id === groupId)
        seen[groupId] = result.length
        result.push({ groupName, sortOrder: g?.sort_order ?? 0, items: [] })
      }
      result[seen[groupId]].items.push({ name: item.attribute.name, value: item.value })
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [attributesResponse, attrGroupsResponse])

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

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n)

  const formattedPrice = variantPricing ? fmt(variantPricing.total_price) : "—"

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

                {/* Share button + teleported popover */}
                <div className="absolute top-4 right-16 z-10">
                  <button
                    ref={shareButtonRef}
                    onClick={() => {
                      if (!showShareMenu && shareButtonRef.current) {
                        const rect = shareButtonRef.current.getBoundingClientRect()
                        setShareMenuPos({
                          top: rect.bottom + 8,
                          right: window.innerWidth - rect.right,
                        })
                      }
                      setShowShareMenu(v => !v)
                    }}
                    title="Share product"
                    className="p-2.5 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>

                  {showShareMenu && createPortal(
                    <div ref={shareRef} className="fixed z-[9999] bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-col gap-2 w-44"
                      style={{ top: shareMenuPos.top, right: shareMenuPos.right }}
                    >
                      <p className="text-xs font-semibold text-gray-500 px-1 pb-1">Share via</p>
                      {[
                        {
                          Button: WhatsappShareButton, Icon: WhatsappIcon,
                          label: 'WhatsApp',
                          props: { title: product.name, separator: ' – ' },
                        },
                        {
                          Button: FacebookShareButton, Icon: FacebookIcon,
                          label: 'Facebook',
                          props: {},
                        },
                        {
                          Button: TelegramShareButton, Icon: TelegramIcon,
                          label: 'Telegram',
                          props: { title: product.name },
                        },
                        {
                          Button: TwitterShareButton, Icon: XIcon,
                          label: 'X (Twitter)',
                          props: { title: product.name },
                        },
                      ].map(({ Button, Icon, label, props }) => (
                        <Button
                          key={label}
                          url={window.location.href}
                          {...(props as any)}
                          className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Icon size={28} round />
                          <span className="text-sm text-gray-700">{label}</span>
                        </Button>
                      ))}

                      <div className="border-t border-gray-100 mt-1 pt-1 flex flex-col gap-0.5">
                        {'share' in navigator && (
                          <button
                            onClick={async () => {
                              try {
                                await navigator.share({
                                  title: product.name,
                                  text: product.description?.slice(0, 100) || product.name,
                                  url: window.location.href,
                                })
                              } catch { /* user cancelled */ }
                            }}
                            className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                              <Share2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">Instagram & more</span>
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(window.location.href)
                            setLinkCopied(true)
                            setTimeout(() => setLinkCopied(false), 2000)
                          }}
                          className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {linkCopied
                            ? <Check className="w-7 h-7 text-green-500" />
                            : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"><Share2 className="w-3.5 h-3.5 text-gray-600" /></div>}
                          <span className="text-sm text-gray-700">{linkCopied ? 'Copied!' : 'Copy link'}</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>

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
                    loading="eager"
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
                        loading="lazy"
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
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl lg:text-4xl font-bold text-header">{formattedPrice}</span>
                </div>
                {variantPricing && (
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <div className="flex gap-4">
                      <span>Metal cost: <span className="text-gray-700">{fmt(variantPricing.metal_cost)}</span></span>
                      <span>Making charge: <span className="text-gray-700">{fmt(variantPricing.making_charge)}</span></span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Incl. {variantPricing.tax_rate}% tax ({fmt(variantPricing.tax_amount)})
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {selectedVariant && selectedVariant.stock_quantity > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      In Stock
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
                          .join(" · ")

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

              {/* Selected Variant Attributes */}
              {selectedVariant && (() => {
                const attrs = [
                  { label: 'Metal', value: selectedVariant.metal_type },
                  { label: 'Purity', value: selectedVariant.metal_purity },
                  { label: 'Color', value: selectedVariant.metal_color },
                  { label: 'Size', value: selectedVariant.size },
                  { label: 'Gross Weight', value: selectedVariant.gross_weight ? `${selectedVariant.gross_weight}g` : null },
                  { label: 'Net Weight', value: selectedVariant.net_weight ? `${selectedVariant.net_weight}g` : null },
                ].filter(a => a.value)
                if (!attrs.length) return null
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attrs.map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

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

              {/* Error message */}
              {addToCartMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {(addToCartMutation.error as any)?.message || "Failed to add to cart. Please try again."}
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

          {/* Product Specifications & Attributes */}
          {(selectedVariant || attributeGroups.length > 0) && (
            <div className="border-t p-6 lg:p-8 space-y-8">

              {/* Variant specs */}
              {selectedVariant && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Product Specifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'SKU', value: selectedVariant.sku },
                      { label: 'Gender', value: product.gender },
                      { label: 'Metal Type', value: selectedVariant.metal_type },
                      { label: 'Purity', value: selectedVariant.metal_purity },
                      { label: 'Metal Color', value: selectedVariant.metal_color },
                      { label: 'Size', value: selectedVariant.size },
                      { label: 'Gross Weight', value: selectedVariant.gross_weight ? `${selectedVariant.gross_weight}g` : null },
                      { label: 'Net Weight', value: selectedVariant.net_weight ? `${selectedVariant.net_weight}g` : null },
                    ].filter(r => r.value).map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EAV Attributes grouped */}
              {attributeGroups.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {attributeGroups.map(({ groupName, items }) => (
                      <div key={groupName} className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">{groupName}</h3>
                        <div className="space-y-2">
                          {items.map(({ name, value }) => (
                            <div key={name} className="flex justify-between text-sm">
                              <span className="text-gray-500">{name}</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
