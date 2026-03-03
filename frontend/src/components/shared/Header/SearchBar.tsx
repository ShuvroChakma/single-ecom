import { Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/api/categories'
import { getImageUrl } from '@/api/client'

const SearchBar = () => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Fetch search suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => getProducts({ search: debouncedSearch, per_page: 5 }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  })

  const searchResults = suggestions?.success ? suggestions.data.items : []

  const handleClear = () => {
    setSearchValue('')
    inputRef.current?.focus()
  }

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate({ to: '/products', search: { q: searchValue.trim() } })
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-full max-w-lg lg:max-w-2xl xl:max-w-3xl">
      <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          className={`
            w-full py-2.5 px-4 pr-24
            bg-transparent
            border-b border-white/80
            text-white text-sm
            placeholder:text-white/90
            focus:outline-none
            focus:bg-white/10
            focus:border-white/50
            transition-all duration-200

          `}
          aria-label="Search products"
        />

        {/* Clear button - shows when there's text */}
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>


      {/* Search suggestions dropdown */}
      {isFocused && searchValue.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-100">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}-${product.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSearchValue('')
                    setIsFocused(false)
                  }}
                >
                  <img
                    src={getImageUrl(product.images?.[0], '/placeholder-product.jpg')}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku_base}</p>
                  </div>
                </Link>
              ))}
              {/* View all results link */}
              <button
                onClick={handleSearch}
                className="w-full p-3 text-sm text-center text-header font-medium hover:bg-gray-50 border-t"
              >
                View all results for "{searchValue}"
              </button>
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              No products found for "{searchValue}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
