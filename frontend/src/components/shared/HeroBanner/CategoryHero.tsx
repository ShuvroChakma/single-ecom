import { getFeaturedCategories, type Category } from '@/api/categories'
import { getImageUrl } from '@/api/client'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

export default function CategoryHero() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories-featured'],
    queryFn: async () => {
      const result = await getFeaturedCategories()
      return result.success && Array.isArray(result.data) ? result.data : []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const categories: Category[] = data ?? []

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
            const imageUrl = getImageUrl(category.icon) || getImageUrl(category.banner) || ''

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
