import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { Search, SlidersHorizontal, Grid, List, ChevronDown, ChevronUp, Heart, Loader2, X, Check } from 'lucide-react'
import Header from '@/components/shared/Header/Header'
import Footer from '@/components/shared/Footer/Footer'
import { getProducts, getCategoryTree, findCategoryBySlug } from '@/api/categories'
import { getMetals, getFilterableAttributes } from '@/api/products'
import { getImageUrl } from '@/api/client'
import { addToWishlist, removeFromWishlist, getWishlist } from '@/api/wishlist'
import { useAuth } from '@/hooks/useAuth'
import { useLoginModal } from '@/contexts/LoginModalContext'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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

// Search params type
type ProductsSearch = {
  q?: string
  category?: string
}

export const Route = createFileRoute('/products/')({
  head: () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || ''
    const canonicalUrl = `${siteUrl}/products`
    return {
      meta: [
        { title: 'All Products | Nazu Meah Jewellers' },
        { name: 'description', content: 'Browse our full collection of fine jewellery — gold, silver, diamond rings, necklaces, bangles and more at Nazu Meah Jewellers.' },
        { property: 'og:title', content: 'All Products | Nazu Meah Jewellers' },
        { property: 'og:description', content: 'Browse our full collection of fine jewellery at Nazu Meah Jewellers.' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
    }
  },
  component: ProductsPage,
  validateSearch: (search: Record<string, unknown>): ProductsSearch => {
    return {
      q: typeof search.q === 'string' ? search.q : undefined,
      category: typeof search.category === 'string' ? search.category : undefined,
    }
  },
})

function ProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { q, category } = Route.useSearch()
  const [searchQuery, setSearchQuery] = useState(q || '')
  const [debouncedSearch, setDebouncedSearch] = useState(q || '')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedMetals, setSelectedMetals] = useState<string[]>([])
  const [selectedPurities, setSelectedPurities] = useState<string[]>([])
  const [minWeight, setMinWeight] = useState('')
  const [maxWeight, setMaxWeight] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})
  const { isAuthenticated } = useAuth()
  const { showLoginModal } = useLoginModal()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Sync URL query param with local state
  useEffect(() => {
    if (q !== undefined) {
      setSearchQuery(q)
    }
  }, [q])

  // Fetch category tree to resolve slug to ID
  const { data: categoryTree } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => {
      const result = await getCategoryTree()
      return result.success ? result.data : []
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!category,
  })

  // Resolve category slug to ID
  const selectedCategory = useMemo(() => {
    if (!category || !Array.isArray(categoryTree)) return null
    return findCategoryBySlug(categoryTree, category)
  }, [category, categoryTree])

  // Fetch metals from API
  const { data: metalsData } = useQuery({
    queryKey: ['metals'],
    queryFn: () => getMetals(),
    staleTime: 10 * 60 * 1000,
  })
  // Metal objects with code (for filtering) and purities
  const metalObjects: { name: string; code: string; purities: { name: string; code: string }[] }[] =
    metalsData?.success ? metalsData.data.map((m: any) => ({
      name: m.name,
      code: m.code,
      purities: (m.purities || []).filter((p: any) => p.is_active),
    })) : []

  // Purities available for selected metals (or all purities if none selected)
  const availablePurities = selectedMetals.length
    ? metalObjects.filter(m => selectedMetals.includes(m.code)).flatMap(m => m.purities)
    : metalObjects.flatMap(m => m.purities)

  // Deduplicate purities by code
  const uniquePurities = availablePurities.filter((p, i, arr) => arr.findIndex(x => x.code === p.code) === i)

  // Fetch filterable EAV attributes
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

  // Fetch products with infinite query
  const effectiveGenders = resolveGenders(selectedGenders)

  const clearAllFilters = () => {
    setSelectedGenders([])
    setSelectedMetals([])
    setSelectedPurities([])
    setMinWeight('')
    setMaxWeight('')
    setInStockOnly(false)
    setSelectedAttributes({})
    setSearchQuery('')
  }

  const activeFilterCount =
    selectedGenders.length + selectedMetals.length + selectedPurities.length +
    activeAttrCount + (inStockOnly ? 1 : 0) + (minWeight ? 1 : 0) + (maxWeight ? 1 : 0)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['products', debouncedSearch, sortBy, selectedCategory?.id, selectedGenders, selectedMetals, selectedPurities, minWeight, maxWeight, inStockOnly, selectedAttributes],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getProducts({
        data: {
          page: pageParam,
          per_page: 12,
          search: debouncedSearch || undefined,
          category_id: selectedCategory?.id || undefined,
          genders: effectiveGenders.length ? effectiveGenders : undefined,
          metal_types: selectedMetals.length ? selectedMetals : undefined,
          metal_purities: selectedPurities.length ? selectedPurities : undefined,
          min_weight: minWeight ? Number(minWeight) : undefined,
          max_weight: maxWeight ? Number(maxWeight) : undefined,
          in_stock: inStockOnly || undefined,
          attribute_filters: Object.keys(selectedAttributes).length ? selectedAttributes : undefined,
        },
      })
      return result
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.success) return undefined
      const { page, pages } = lastPage.data
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !category || !!selectedCategory,
  })

  const products = data?.pages.flatMap((page) => (page.success ? page.data.items : [])) || []
  const totalProducts = data?.pages[0]?.success ? data.pages[0].data.total : 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by the query
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Products</h1>
          <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-header hover:underline"
          >
            Refresh Page
          </button>
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
          {selectedCategory ? (
            <>
              <Link to="/products" className="hover:text-header">
                Products
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-900 font-medium">All Products</span>
          )}
        </nav>

        {/* Top toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory.name : 'All Products'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalProducts} products</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 sm:w-56"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={13} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 appearance-none pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
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
            {/* Mobile filter toggle */}
            <button onClick={() => setShowFilters(v => !v)}
              className={cn(
                'lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium',
                showFilters ? 'bg-header text-white border-header' : 'bg-white border-gray-200 text-gray-700'
              )}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && <span className="bg-white text-header rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>}
            </button>
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
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-header text-white rounded-full px-2 py-0.5">{activeFilterCount}</span>
                )}
              </div>

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
                  <X size={11} /> Clear all
                </button>
              )}
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
              <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto shadow-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)}><X size={20} className="text-gray-500" /></button>
                </div>

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
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1 min-w-0">

        {/* Products Grid */}
        {isLoading ? (
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
            <p className="text-gray-600 mb-4">
              {searchQuery ? `No products match "${searchQuery}"` : 'No products available at the moment'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-header hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'
              }
            >
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}-${product.id}`}
                  className={`group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div
                    className={`relative bg-gray-50 overflow-hidden ${
                      viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={getImageUrl(product.images?.[0], '/placeholder-product.jpg')}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.is_featured && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-header text-white text-xs font-medium rounded">
                        Featured
                      </span>
                    )}
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        {addingToWishlist === product.id ? (
                          <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                        ) : wishlistItemMap.has(product.id) ? (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        ) : (
                          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 hover:fill-red-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-header transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{product.sku_base}</p>
                    {product.description && viewMode === 'list' && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                    )}
                    {(() => {
                      const prices = (product.variants || [])
                        .map((v: any) => v.calculated_price)
                        .filter((p: any): p is number => p != null && p > 0)
                      if (!prices.length) return null
                      const min = Math.min(...prices)
                      const max = Math.max(...prices)
                      const label = min === max
                        ? `৳ ${min.toLocaleString('en-BD')}`
                        : `৳ ${min.toLocaleString('en-BD')} – ৳ ${max.toLocaleString('en-BD')}`
                      return <p className="text-sm font-semibold text-top_bar mt-2">{label}</p>
                    })()}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{product.gender}</span>
                      {product.variants && product.variants.length > 1 && (
                        <span className="text-xs text-gray-400">
                          {product.variants.length} variants
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-header text-white rounded-lg font-medium hover:bg-header/90 disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More Products'}
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
