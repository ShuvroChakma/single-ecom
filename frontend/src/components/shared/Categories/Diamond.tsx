import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Heart, Loader2, X } from 'lucide-react'
import { getProducts } from '@/api/categories'
import { addToWishlist } from '@/api/wishlist'

interface FilterState {
  metal_purity?: string
  metal_type?: string
  gender?: string
  in_stock?: boolean
  sort_by: string
  min_weight?: number
  max_weight?: number
}

const Diamond = () => {
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    sort_by: 'newest'
  })

  // Fetch products with diamond/jewellery metal type
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['diamond-products', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getProducts({
        metal_type: filters.metal_type || undefined,
        metal_purity: filters.metal_purity || undefined,
        gender: filters.gender || undefined,
        in_stock: filters.in_stock,
        min_weight: filters.min_weight,
        max_weight: filters.max_weight,
        sort_by: filters.sort_by as any,
        page: pageParam,
        per_page: 12,
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
  })

  const products = data?.pages.flatMap((page) => (page.success ? page.data.items : [])) || []

  // Add to wishlist mutation
  const addWishlistMutation = useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
    onMutate: (productId) => setAddingToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
    onSettled: () => setAddingToWishlist(null),
  })

  // Get image URL helper
  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder-product.jpg'
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${path}`
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ sort_by: 'newest' })
  }

  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full md:max-w-3xl lg:max-w-5xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-semibold">FILTER BY</h2>
          <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {/* Metal Purity */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">METAL PURITY</h3>
            <div className="space-y-2 text-sm">
              {['14K', '18K', '22K', '24K'].map((purity) => (
                <label key={purity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purity"
                    checked={filters.metal_purity === purity}
                    onChange={() => handleFilterChange('metal_purity', purity)}
                    className="w-4 h-4"
                  />
                  <span>{purity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Metal Type */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">METAL TYPE</h3>
            <div className="space-y-2 text-sm">
              {['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="metalType"
                    checked={filters.metal_type === type}
                    onChange={() => handleFilterChange('metal_type', type)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{type.toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">GENDER</h3>
            <div className="space-y-2 text-sm">
              {['WOMEN', 'MEN', 'UNISEX', 'KIDS'].map((gender) => (
                <label key={gender} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={filters.gender === gender}
                    onChange={() => handleFilterChange('gender', gender)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{gender.toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weight Range */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">WEIGHT RANGE</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: '0-2 Grams', min: 0, max: 2 },
                { label: '2-4 Grams', min: 2, max: 4 },
                { label: '4-6 Grams', min: 4, max: 6 },
                { label: '6-10 Grams', min: 6, max: 10 },
                { label: '10+ Grams', min: 10, max: undefined },
              ].map((range) => (
                <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="weight"
                    checked={filters.min_weight === range.min && filters.max_weight === range.max}
                    onChange={() => {
                      handleFilterChange('min_weight', range.min)
                      handleFilterChange('max_weight', range.max)
                    }}
                    className="w-4 h-4"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">AVAILABILITY</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.in_stock === true}
                  onChange={(e) => handleFilterChange('in_stock', e.target.checked ? true : undefined)}
                  className="w-4 h-4"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-4">
          <button
            onClick={clearFilters}
            className="flex-1 px-6 py-3 border border-gray-300 rounded hover:bg-gray-50"
          >
            CLEAR ALL
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="flex-1 px-6 py-3 bg-header text-white rounded hover:bg-header/90"
          >
            APPLY FILTERS
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="relative">
        <img
          src="https://static.malabargoldanddiamonds.com/media/catalog/category/Category_diamond-jewellery_1_1.jpg"
          alt="Diamond Jewellery"
          className="w-full h-auto sm:h-40 md:h-48 lg:h-56 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-end px-4 sm:px-8 lg:pr-16">
          <div className="text-right">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-header">
              Diamond Jewellery Collection
            </h1>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
        <Link to="/" className="hover:text-header">Home</Link>
        {' / '}
        <Link to="/products" className="hover:text-header">Products</Link>
        {' / '}
        <span className="font-medium">Diamond</span>
      </div>

      {/* Filters Bar */}
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-y">
        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex-1 px-4 py-2 border rounded hover:border-header flex items-center justify-center gap-2 text-sm"
          >
            FILTERS <ChevronDown size={16} />
          </button>

          <select
            value={filters.sort_by}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            className="flex-1 px-3 py-2 border rounded hover:border-header text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="name_desc">Name: Z-A</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex gap-4 flex-wrap">
            <select
              value={filters.metal_type || ''}
              onChange={(e) => handleFilterChange('metal_type', e.target.value || undefined)}
              className="px-4 py-2 border rounded hover:border-header text-sm"
            >
              <option value="">METAL TYPE</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="PLATINUM">Platinum</option>
              <option value="DIAMOND">Diamond</option>
            </select>

            <select
              value={filters.metal_purity || ''}
              onChange={(e) => handleFilterChange('metal_purity', e.target.value || undefined)}
              className="px-4 py-2 border rounded hover:border-header text-sm"
            >
              <option value="">PURITY</option>
              <option value="14K">14K</option>
              <option value="18K">18K</option>
              <option value="22K">22K</option>
              <option value="24K">24K</option>
            </select>

            <select
              value={filters.in_stock === true ? 'true' : ''}
              onChange={(e) => handleFilterChange('in_stock', e.target.value === 'true' ? true : undefined)}
              className="px-4 py-2 border rounded hover:border-header text-sm"
            >
              <option value="">STOCK STATUS</option>
              <option value="true">In Stock</option>
            </select>

            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 border rounded hover:border-header flex items-center gap-2 text-sm"
            >
              MORE FILTERS <ChevronDown size={16} />
            </button>

            {(filters.metal_type || filters.metal_purity || filters.in_stock || filters.gender) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-header hover:underline text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          <select
            value={filters.sort_by}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            className="px-4 py-2 border rounded hover:border-header text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="name_desc">Name: Z-A</option>
            <option value="featured">Featured</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-header" size={40} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <button onClick={clearFilters} className="mt-4 text-header hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
                <Link to={`/products/${product.slug}-${product.id}`}>
                  <div className="relative">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-full h-56 sm:h-64 md:h-72 object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addWishlistMutation.mutate(product.id)
                      }}
                      disabled={addingToWishlist === product.id}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                    >
                      {addingToWishlist === product.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Heart size={18} className="text-gray-400 hover:text-red-500 hover:fill-red-500" />
                      )}
                    </button>
                    {product.is_featured && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-header text-white text-xs rounded">
                        Featured
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku_base}</p>
                  {product.gender && (
                    <p className="text-xs text-gray-400 mt-1 capitalize">{product.gender.toLowerCase()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && !isLoading && (
          <div className="flex justify-center mt-8 sm:mt-12">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-8 py-3 border-2 border-header text-header rounded-lg hover:bg-header hover:text-white transition-colors font-medium disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'SHOW MORE'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && <FilterModal />}
    </div>
  )
}

export default Diamond
