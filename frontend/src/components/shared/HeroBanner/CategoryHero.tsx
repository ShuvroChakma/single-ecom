import { getCategoryTree, type Category } from '@/api/categories'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

// Get image URL helper
const getImageUrl = (path: string | null) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${path}`
}

// Default category images as fallback
const DEFAULT_IMAGES: Record<string, string> = {
  diamond: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/diamond-offer.jpg',
  gold: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/Gold-offer.jpg',
  silver: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/10_oct/diwali24/homepage/silver-bars-coins-focus.jpg',
  platinum: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/solitare.jpg',
  gemstone: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/Gemstone-offer.jpg',
  ring: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/solitare.jpg',
  necklace: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/Mangalsutra.jpg',
  earring: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Offer.jpg',
  bangle: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Bangle-1.jpg',
  bracelet: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Bangle-1.jpg',
  chain: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Chain-1.jpg',
  pendant: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/10_oct/diwali24/homepage/gold-coin-pendant-focus.jpg',
  default: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/05_may/india-homepage/focus-block/best-seller.jpg',
}

// Get fallback image based on category name
const getFallbackImage = (name: string): string => {
  const key = name.toLowerCase()
  for (const [keyword, url] of Object.entries(DEFAULT_IMAGES)) {
    if (key.includes(keyword)) {
      return url
    }
  }
  return DEFAULT_IMAGES.default
}

// Flatten category tree to get all categories
const flattenCategories = (categories: Category[]): Category[] => {
  if (!Array.isArray(categories)) return []
  const result: Category[] = []
  for (const cat of categories) {
    if (cat.is_active) {
      result.push(cat)
      if (cat.children?.length > 0) {
        result.push(...flattenCategories(cat.children))
      }
    }
  }
  return result
}

export default function CategoryHero() {
  const { data, isLoading } = useQuery({
    queryKey: ['category-tree-hero'],
    queryFn: async () => {
      const result = await getCategoryTree()
      if (result.success && Array.isArray(result.data)) {
        return result.data
      }
      return []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Get all active categories (flattened, limited to 14 for display)
  const categories = Array.isArray(data) ? flattenCategories(data).slice(0, 14) : []

  if (isLoading) {
    return (
      <div className="w-full py-4">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Loader2 className="animate-spin text-header" size={32} />
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="w-full py-4">
      <div className="max-w-7xl mx-auto">
        {/* Mobile to md: scrollable | lg+: flex-wrap */}
        <div
          className="
            flex
            overflow-x-auto
            lg:overflow-visible
            gap-3 sm:gap-2.5 lg:gap-0
            pb-3 px-1 sm:px-2

            lg:flex-wrap
            lg:justify-between
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((category) => {
            const imageUrl = getImageUrl(category.icon) || getImageUrl(category.banner) || getFallbackImage(category.name)

            return (
              <Link
                key={category.id}
                to="/products"
                search={{ category: category.slug }}
                className="
                  flex flex-col items-center shrink-0 min-w-20 sm:min-w-[90px]
                  hover:opacity-80 transition-opacity
                "
              >
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-center text-gray-800 whitespace-nowrap mt-1">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
