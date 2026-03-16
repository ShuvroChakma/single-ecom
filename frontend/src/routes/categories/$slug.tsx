import { useState, useMemo, useEffect } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Heart, SlidersHorizontal, X, ChevronDown, ChevronUp, Grid, List, Check, Loader2,
} from "lucide-react"
import Header from "@/components/shared/Header/Header"
import Footer from "@/components/shared/Footer/Footer"
import { getCategoryTree, getProducts, findCategoryBySlug } from "@/api/categories"
import { getMetals, getFilterableAttributes } from "@/api/products"
import { addToWishlist, removeFromWishlist, getWishlist } from "@/api/wishlist"
import { getImageUrl } from "@/api/client"
import { useAuth } from "@/hooks/useAuth"
import { useLoginModal } from "@/contexts/LoginModalContext"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/categories/$slug")({
  loader: async ({ params }) => {
    try {
      const response = await getCategoryTree()
      const category = response?.success ? findCategoryBySlug(response.data, params.slug) : null
      return { category, categoryTree: response?.success ? response : null }
    } catch {
      return { category: null, categoryTree: null }
    }
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category
    if (!category) return { meta: [{ title: 'Collection | Nazu Meah Jewellers' }] }
    const title = `${category.name} | Nazu Meah Jewellers`
    const description = `Shop our ${category.name} collection at Nazu Meah Jewellers. Browse the finest jewellery crafted for every occasion.`
    const image = category.banner ? getImageUrl(category.banner) : ''
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
    }
  },
  component: CategoryPage,
})

const GENDERS = ['Men', 'Women', 'Unisex', 'Kids']

function resolveGenders(selected: string[]): string[] {
  const result = new Set(selected)
  if (selected.includes('Men') || selected.includes('Women')) result.add('Unisex')
  return Array.from(result)
}

function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 pb-4">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-900">
        {title}
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active ? 'bg-header text-white border-header' : 'bg-white text-gray-600 border-gray-200 hover:border-header/40 hover:text-header'
      )}>
      {active && <Check size={10} />}
      {children}
    </button>
  )
}

function CategoryPage() {
  const { slug } = Route.useParams()
  const loaderData = Route.useLoaderData()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const { showLoginModal } = useLoginModal()

  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedMetals, setSelectedMetals] = useState<string[]>([])
  const [selectedPurities, setSelectedPurities] = useState<string[]>([])
  const [minWeight, setMinWeight] = useState('')
  const [maxWeight, setMaxWeight] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null)

  // Fetch category tree — use loader data as initialData (no loading flash)
  const { data: categoriesResponse } = useQuery({
    queryKey: ["category-tree"],
    queryFn: () => getCategoryTree(),
    staleTime: 5 * 60 * 1000,
    initialData: loaderData?.categoryTree ?? undefined,
  })

  const currentCategory = useMemo(() => {
    if (!categoriesResponse?.success || !categoriesResponse.data) return null
    return findCategoryBySlug(categoriesResponse.data, slug)
  }, [categoriesResponse, slug])

  // Fetch metals from API
  const { data: metalsData } = useQuery({
    queryKey: ['metals'],
    queryFn: () => getMetals(),
    staleTime: 10 * 60 * 1000,
  })

  const metalObjects: { name: string; code: string; purities: { name: string; code: string }[] }[] =
    metalsData?.success ? metalsData.data.map((m: any) => ({
      name: m.name,
      code: m.code,
      purities: (m.purities || []).filter((p: any) => p.is_active),
    })) : []

  const availablePurities = selectedMetals.length
    ? metalObjects.filter(m => selectedMetals.includes(m.code)).flatMap(m => m.purities)
    : metalObjects.flatMap(m => m.purities)

  const uniquePurities = availablePurities.filter((p, i, arr) => arr.findIndex(x => x.code === p.code) === i)

  // Filterable EAV attributes
  const { data: filterableAttrsData } = useQuery({
    queryKey: ['filterable-attributes'],
    queryFn: () => getFilterableAttributes(),
    staleTime: 10 * 60 * 1000,
  })
  const filterableAttributes = filterableAttrsData?.success
    ? filterableAttrsData.data.filter((a: any) => a.options && a.options.length > 0)
    : []

  const toggleAttributeValue = (code: string, value: string) => {
    setSelectedAttributes(prev => {
      const current = prev[code] || []
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      if (!updated.length) {
        const { [code]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [code]: updated }
    })
  }

  const activeAttrCount = Object.values(selectedAttributes).reduce((sum, vals) => sum + vals.length, 0)

  const effectiveGenders = resolveGenders(selectedGenders)

  const clearAllFilters = () => {
    setSelectedGenders([])
    setSelectedMetals([])
    setSelectedPurities([])
    setMinWeight('')
    setMaxWeight('')
    setInStockOnly(false)
    setSelectedAttributes({})
  }

  const activeFilterCount =
    selectedGenders.length + selectedMetals.length + selectedPurities.length +
    activeAttrCount + (inStockOnly ? 1 : 0) + (minWeight ? 1 : 0) + (maxWeight ? 1 : 0)

  // Fetch wishlist to know which products are already saved
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => getWishlist(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })
  const wishlistItemMap = useMemo(() => {
    const map = new Map<string, string>() // productId → wishlistItemId
    if (wishlistData?.success && wishlistData.data?.items) {
      for (const item of wishlistData.data.items) {
        map.set(item.product.id, item.id)
      }
    }
    return map
  }, [wishlistData])

  // Add to wishlist — optimistic update
  const addWishlistMutation = useMutation({
    mutationFn: (productId: string) => addToWishlist({ data: { product_id: productId } }),
    onMutate: async (productId) => {
      setAddingToWishlist(productId)
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previousData = queryClient.getQueryData<any>(['wishlist'])
      queryClient.setQueryData(['wishlist'], (old: any) => {
        if (!old?.success || !old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            items: [...old.data.items, {
              id: `optimistic-${productId}`,
              product: { id: productId, name: '', slug: '', image: null },
              variant: null,
              added_at: new Date().toISOString(),
            }],
            total: old.data.total + 1,
          },
        }
      })
      return { previousData }
    },
    onError: (_err, _productId, context) => {
      if (context?.previousData) queryClient.setQueryData(['wishlist'], context.previousData)
    },
    onSettled: () => {
      setAddingToWishlist(null)
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Remove from wishlist — optimistic update
  const removeWishlistMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string; productId: string }) => removeFromWishlist({ data: { itemId } }),
    onMutate: async ({ itemId, productId }) => {
      setAddingToWishlist(productId)
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previousData = queryClient.getQueryData<any>(['wishlist'])
      queryClient.setQueryData(['wishlist'], (old: any) => {
        if (!old?.success || !old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((item: any) => item.id !== itemId),
            total: Math.max(0, old.data.total - 1),
          },
        }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) queryClient.setQueryData(['wishlist'], context.previousData)
    },
    onSettled: () => {
      setAddingToWishlist(null)
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["category-products", currentCategory?.id, selectedGenders, selectedMetals, selectedPurities, minWeight, maxWeight, inStockOnly, selectedAttributes, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      if (!currentCategory?.id) return { success: false, data: { items: [], total: 0, page: 1, per_page: 20, pages: 0 } }
      return getProducts({
        data: {
          category_id: currentCategory.id,
          page: pageParam,
          per_page: 20,
          sort_by: sortBy as any,
          genders: effectiveGenders.length ? effectiveGenders : undefined,
          metal_types: selectedMetals.length ? selectedMetals : undefined,
          metal_purities: selectedPurities.length ? selectedPurities : undefined,
          min_weight: minWeight ? Number(minWeight) : undefined,
          max_weight: maxWeight ? Number(maxWeight) : undefined,
          in_stock: inStockOnly || undefined,
          attribute_filters: Object.keys(selectedAttributes).length ? selectedAttributes : undefined,
        },
      })
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.success) return undefined
      const { page, pages } = lastPage.data
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!currentCategory?.id,
  })

  const products = productsData?.pages.flatMap(p => p.success ? p.data.items : []) || []
  const totalProducts = productsData?.pages?.[0]?.success ? productsData.pages[0].data.total : 0

  // Filter sidebar content (shared between desktop & mobile)
  const FilterContent = () => (
    <>
      <FilterSection title="Gender">
        <div className="flex flex-wrap gap-1.5">
          {GENDERS.map(g => (
            <Chip key={g} active={selectedGenders.includes(g)}
              onClick={() => setSelectedGenders(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g])}>
              {g}
            </Chip>
          ))}
        </div>
        {selectedGenders.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">Includes: {resolveGenders(selectedGenders).join(', ')}</p>
        )}
      </FilterSection>

      <FilterSection title="Metal Type">
        <div className="flex flex-wrap gap-1.5">
          {metalObjects.map(m => (
            <Chip key={m.code} active={selectedMetals.includes(m.code)}
              onClick={() => {
                setSelectedMetals(p => p.includes(m.code) ? p.filter(x => x !== m.code) : [...p, m.code])
                setSelectedPurities([])
              }}>
              {m.name}
            </Chip>
          ))}
        </div>
      </FilterSection>

      {uniquePurities.length > 0 && (
        <FilterSection title="Purity">
          <div className="flex flex-wrap gap-1.5">
            {uniquePurities.map(p => (
              <Chip key={p.code} active={selectedPurities.includes(p.code)}
                onClick={() => setSelectedPurities(prev => prev.includes(p.code) ? prev.filter(x => x !== p.code) : [...prev, p.code])}>
                {p.name}
              </Chip>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Weight (g)" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" placeholder="Min"
            value={minWeight}
            onChange={e => setMinWeight(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-header/30 focus:border-header"
          />
          <span className="text-gray-400 text-xs shrink-0">–</span>
          <input
            type="number" min="0" placeholder="Max"
            value={maxWeight}
            onChange={e => setMaxWeight(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-header/30 focus:border-header"
          />
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen={false}>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <button type="button" onClick={() => setInStockOnly(v => !v)}
            className={cn('w-9 h-5 rounded-full transition-colors relative', inStockOnly ? 'bg-header' : 'bg-gray-200')}>
            <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              inStockOnly ? 'translate-x-4' : 'translate-x-0.5')} />
          </button>
          <span className="text-sm text-gray-700">In Stock Only</span>
        </label>
      </FilterSection>

      {filterableAttributes.map((attr: any) => (
        <FilterSection key={attr.code} title={attr.name} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {attr.options.map((opt: string) => (
              <Chip key={opt}
                active={(selectedAttributes[attr.code] || []).includes(opt)}
                onClick={() => toggleAttributeValue(attr.code, opt)}>
                {opt}
              </Chip>
            ))}
          </div>
        </FilterSection>
      ))}

      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
          <X size={11} /> Clear all filters
        </button>
      )}
    </>
  )

  if (!currentCategory && categoriesResponse?.success) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20 text-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Category Not Found</h1>
            <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
            <Link to="/" className="text-header hover:underline">Go back to home</Link>
          </div>
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
          <Link to="/" className="hover:text-header">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-header">Products</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{currentCategory?.name || slug}</span>
        </nav>

        {/* Category Header */}
        {currentCategory?.banner ? (
          <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6">
            <img src={getImageUrl(currentCategory.banner)} alt={currentCategory.name}
              loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{currentCategory.name}</h1>
              <p className="text-white/80 mt-1">{totalProducts} Products</p>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{currentCategory?.name || slug}</h1>
            <p className="text-gray-500 mt-1">{totalProducts} products</p>
          </div>
        )}

        {/* Subcategories */}
        {currentCategory?.children && currentCategory.children.filter(c => c.is_active).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {currentCategory.children.filter(c => c.is_active).map(sub => (
              <Link key={sub.id} to={`/categories/${sub.slug}`}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-header hover:text-white hover:border-header rounded-full text-sm font-medium transition-colors shadow-sm">
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button onClick={() => setShowFilters(v => !v)}
              className={cn(
                'lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium',
                showFilters ? 'bg-header text-white border-header' : 'bg-white border-gray-200 text-gray-700'
              )}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-header rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="h-10 appearance-none pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors">
                <option value="newest">Newest First</option>
                <option value="name_asc">Name: A–Z</option>
                <option value="name_desc">Name: Z–A</option>
                <option value="featured">Featured</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={cn('p-2.5', viewMode === 'grid' ? 'bg-header text-white' : 'bg-white text-gray-400 hover:bg-gray-50')}>
                <Grid size={16} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={cn('p-2.5', viewMode === 'list' ? 'bg-header text-white' : 'bg-white text-gray-400 hover:bg-gray-50')}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedGenders.map(g => (
              <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                {g} <button onClick={() => setSelectedGenders(p => p.filter(x => x !== g))}><X size={10} /></button>
              </span>
            ))}
            {selectedMetals.map(code => {
              const metal = metalObjects.find(m => m.code === code)
              return (
                <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                  {metal?.name ?? code} <button onClick={() => setSelectedMetals(p => p.filter(x => x !== code))}><X size={10} /></button>
                </span>
              )
            })}
            {selectedPurities.map(p => (
              <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                {p} <button onClick={() => setSelectedPurities(prev => prev.filter(x => x !== p))}><X size={10} /></button>
              </span>
            ))}
            {(minWeight || maxWeight) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                Weight: {minWeight || '0'}g – {maxWeight || '∞'}g
                <button onClick={() => { setMinWeight(''); setMaxWeight('') }}><X size={10} /></button>
              </span>
            )}
            {Object.entries(selectedAttributes).map(([code, values]) =>
              values.map(v => (
                <span key={`${code}:${v}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                  {v} <button onClick={() => toggleAttributeValue(code, v)}><X size={10} /></button>
                </span>
              ))
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-header/10 text-header text-xs rounded-full font-medium">
                In Stock <button onClick={() => setInStockOnly(false)}><X size={10} /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-red-500 underline">Clear all</button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-header text-white rounded-full px-2 py-0.5">{activeFilterCount}</span>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Mobile drawer */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
              <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto shadow-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)}><X size={20} className="text-gray-500" /></button>
                </div>
                <FilterContent />
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1 min-w-0">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or check back later.</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-header hover:underline text-sm">Clear filters</button>
                )}
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'}>
                  {products.map(product => {
                    const prices = (product.variants || [])
                      .map((v: any) => v.calculated_price)
                      .filter((p: any): p is number => p != null && p > 0)
                    const priceLabel = prices.length
                      ? (() => {
                          const min = Math.min(...prices)
                          const max = Math.max(...prices)
                          return min === max
                            ? `৳ ${min.toLocaleString('en-BD')}`
                            : `৳ ${min.toLocaleString('en-BD')} – ৳ ${max.toLocaleString('en-BD')}`
                        })()
                      : null

                    return (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}-${product.id}`}
                        className={cn(
                          'group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow',
                          viewMode === 'list' && 'flex'
                        )}>
                        <div className={cn(
                          'relative bg-gray-50 overflow-hidden',
                          viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-square'
                        )}>
                          <img
                            src={getImageUrl(product.images?.[0], '/placeholder-product.jpg')}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.is_featured && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-header text-white text-xs font-medium rounded">Featured</span>
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!isAuthenticated) {
                                  showLoginModal('Please login to save items to your wishlist', () => {
                                    addWishlistMutation.mutate(product.id)
                                  })
                                  return
                                }
                                const existingItemId = wishlistItemMap.get(product.id)
                                if (existingItemId) {
                                  removeWishlistMutation.mutate({ itemId: existingItemId, productId: product.id })
                                } else {
                                  addWishlistMutation.mutate(product.id)
                                }
                              }}
                              disabled={addingToWishlist === product.id}
                              className="p-2 bg-white rounded-full shadow hover:bg-gray-50 disabled:opacity-50"
                            >
                              {addingToWishlist === product.id
                                ? <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                                : wishlistItemMap.has(product.id)
                                  ? <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                                  : <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 hover:fill-red-500" />}
                            </button>
                          </div>
                        </div>
                        <div className={cn('p-4', viewMode === 'list' && 'flex-1 flex flex-col justify-center')}>
                          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-header transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{product.sku_base}</p>
                          {priceLabel && (
                            <p className="text-sm font-semibold text-top_bar mt-2">{priceLabel}</p>
                          )}
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{product.gender}</span>
                            {product.variants && product.variants.length > 1 && (
                              <span className="text-xs text-gray-400">{product.variants.length} variants</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 bg-header text-white rounded-lg font-medium hover:bg-header/90 disabled:opacity-50 transition-colors"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
