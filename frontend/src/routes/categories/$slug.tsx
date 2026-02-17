import { useState, useMemo, useCallback } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { Heart, SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutGrid } from "lucide-react"
import Header from "@/components/shared/Header/Header"
import Footer from "@/components/shared/Footer/Footer"
import {
  getCategoryTree,
  getProducts,
  findCategoryBySlug,
  type Category,
  type Product,
  type ProductFilters,
} from "@/api/categories"
import { getImageUrl } from "@/api/client"

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
})

function CategoryPage() {
  const { slug } = Route.useParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3)
  const [filters, setFilters] = useState<ProductFilters>({})

  // Fetch category tree
  const { data: categoriesResponse } = useQuery({
    queryKey: ["category-tree"],
    queryFn: getCategoryTree,
    staleTime: 5 * 60 * 1000,
  })

  // Find current category from tree
  const currentCategory = useMemo(() => {
    if (!categoriesResponse?.success || !categoriesResponse.data) return null
    return findCategoryBySlug(categoriesResponse.data, slug)
  }, [categoriesResponse, slug])

  // Fetch products for this category
  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["category-products", currentCategory?.id, filters, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      if (!currentCategory?.id) return { items: [], total: 0, page: 1, per_page: 20, pages: 0 }
      const response = await getProducts({
        category_id: currentCategory.id,
        page: pageParam,
        per_page: 20,
        ...filters,
      })
      return response.success ? response.data : { items: [], total: 0, page: 1, per_page: 20, pages: 0 }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !!currentCategory?.id,
  })

  // Flatten all pages of products
  const products = useMemo(() => {
    if (!productsData?.pages) return []
    return productsData.pages.flatMap((page) => page.items)
  }, [productsData])

  const totalProducts = productsData?.pages?.[0]?.total || 0

  // Get product price (from first variant)
  const getProductPrice = useCallback((product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0
    const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0]
    // Price calculation based on weight - adjust as needed
    return defaultVariant.net_weight * 100
  }, [])

  // Breadcrumb path
  const breadcrumbs = useMemo(() => {
    const crumbs: { name: string; path: string }[] = [{ name: "Home", path: "/" }]

    if (currentCategory) {
      // Build breadcrumb from path
      const pathParts = currentCategory.path.split(".")
      if (pathParts.length > 1) {
        // Has parent categories
        // For simplicity, just show current category
        // You could traverse the tree to build full path
      }
      crumbs.push({ name: currentCategory.name, path: `/categories/${currentCategory.slug}` })
    }

    return crumbs
  }, [currentCategory])

  if (!currentCategory && categoriesResponse?.success) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Category Not Found</h1>
            <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
            <Link to="/" className="text-header hover:underline">
              Go back to home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              <Link
                to={crumb.path}
                className={index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "hover:text-header"}
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          {currentCategory?.banner && (
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={getImageUrl(currentCategory.banner)}
                alt={currentCategory.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{currentCategory.name}</h1>
                <p className="text-white/80 mt-1">{totalProducts} Products</p>
              </div>
            </div>
          )}

          {!currentCategory?.banner && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{currentCategory?.name}</h1>
                <p className="text-gray-500 mt-1">{totalProducts} Products</p>
              </div>
            </div>
          )}

          {/* Subcategories */}
          {currentCategory?.children && currentCategory.children.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {currentCategory.children
                .filter((child) => child.is_active)
                .map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/categories/${subcategory.slug}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-header hover:text-white rounded-full text-sm font-medium transition-colors"
                  >
                    {subcategory.name}
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* Filters & Sort Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Grid toggle */}
            <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setGridCols(2)}
                className={`p-1.5 rounded ${gridCols === 2 ? "bg-gray-100" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded ${gridCols === 3 ? "bg-gray-100" : ""}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-gray-50"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div
            className={`grid gap-4 ${
              gridCols === 2
                ? "grid-cols-2"
                : gridCols === 3
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-4 ${
                gridCols === 2
                  ? "grid-cols-2"
                  : gridCols === 3
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  getImageUrl={getImageUrl}
                  getPrice={getProductPrice}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-header text-white rounded-lg font-medium hover:bg-header/90 transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : "Show More"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsFilterOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-140px)]">
              {/* Metal Type Filter */}
              <div>
                <h3 className="font-medium mb-3">Metal Type</h3>
                <div className="space-y-2">
                  {["GOLD", "SILVER", "PLATINUM"].map((metal) => (
                    <label key={metal} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.metal_type === metal}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            metal_type: prev.metal_type === metal ? undefined : metal,
                          }))
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{metal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <h3 className="font-medium mb-3">Gender</h3>
                <div className="space-y-2">
                  {["MEN", "WOMEN", "UNISEX"].map((gender) => (
                    <label key={gender} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.gender === gender}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            gender: prev.gender === gender ? undefined : gender,
                          }))
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <div className="flex gap-3">
                <button
                  onClick={() => setFilters({})}
                  className="flex-1 px-4 py-3 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 px-4 py-3 bg-header text-white rounded-lg font-medium hover:bg-header/90"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

// Product Card Component
function ProductCard({
  product,
  getImageUrl,
  getPrice,
}: {
  product: Product
  getImageUrl: (path: string | null) => string
  getPrice: (product: Product) => number
}) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  const price = getPrice(product)
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price)

  return (
    <div className="group relative">
      {/* Image */}
      <Link to={`/products/${product.slug}-${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={getImageUrl(product.images?.[0], '/placeholder-product.jpg')}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsWishlisted(!isWishlisted)
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>

          {/* Featured badge */}
          {product.is_featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-header text-white text-xs font-medium rounded">
              Featured
            </span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="mt-3">
        <Link to={`/products/${product.slug}-${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-header transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1">{product.sku_base}</p>
        <p className="text-sm font-semibold text-gray-900 mt-2">{formattedPrice}</p>
      </div>
    </div>
  )
}
