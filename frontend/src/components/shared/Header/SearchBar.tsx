import { Search, X } from 'lucide-react'
import { useState } from 'react'

const SearchBar = () => {
  const [searchValue, setSearchValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    setSearchValue('')
  }

  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log('Searching for:', searchValue)
      // Add your search logic here
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="relative w-full max-w-lg lg:max-w-2xl xl:max-w-3xl">
      <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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

      {/* Optional: Search suggestions dropdown */}
      {isFocused && searchValue && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-white rounded shadow-lg border border-gray-200 overflow-hidden z-100">
          <div className="p-1 text-sm text-gray-500">
            Search suggestions will appear here...
          </div>
          {/* Add your suggestions here */}
        </div>
      )}
    </div>
  )
}

export default SearchBar