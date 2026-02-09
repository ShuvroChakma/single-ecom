import { useState, useMemo } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getCategoryTree, type Category } from "@/api/categories"

const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Fetch categories from API with caching
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ["category-tree"],
    queryFn: getCategoryTree,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  })

  // Get top-level categories
  const topLevelCategories = useMemo(() => {
    if (!categoriesResponse?.success || !categoriesResponse.data) return []
    return categoriesResponse.data.filter((cat) => cat.is_active)
  }, [categoriesResponse])

  // Get hovered category data
  const hoveredCategoryData = useMemo(() => {
    if (!hoveredCategory || !topLevelCategories.length) return null
    return topLevelCategories.find((cat) => cat.slug === hoveredCategory) || null
  }, [hoveredCategory, topLevelCategories])

  // Check if category has children (subcategories)
  const hasSubcategories = (category: Category) => {
    return category.children && category.children.length > 0
  }

  // Get image URL helper
  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith("http")) return path
    return `${import.meta.env.VITE_API_URL?.replace("/api/v1", "")}${path}`
  }

  if (isLoading) {
    return (
      <nav className="hidden lg:block sticky top-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="flex items-center justify-center py-4">
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <div className="relative">
      {/* CATEGORY BAR */}
      <nav className="hidden lg:block sticky top-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-start lg:justify-center min-w-max lg:min-w-0 px-4 lg:px-0">
              {topLevelCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative shrink-0"
                  onMouseEnter={() =>
                    hasSubcategories(category) && setHoveredCategory(category.slug)
                  }
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={`/categories/${category.slug}`}
                    className="px-2 xl:px-3 py-4 text-xs xl:text-sm font-medium text-gray-700 hover:text-header transition-colors border-b-2 border-transparent hover:border-header inline-block cursor-pointer whitespace-nowrap uppercase"
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* MEGA MENU */}
      {hoveredCategoryData && hasSubcategories(hoveredCategoryData) && (
        <div
          className="absolute left-0 right-0 top-full bg-white shadow-2xl border-t border-gray-200 z-50"
          onMouseEnter={() => setHoveredCategory(hoveredCategoryData.slug)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row py-6 lg:py-8 gap-6 lg:gap-0">
              {/* LEFT MENU - Subcategories */}
              <div className="w-full lg:w-48 lg:pr-8 lg:border-r-2 border-gray-200">
                <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1">
                  {hoveredCategoryData.children
                    .filter((child) => child.is_active)
                    .map((subcategory, index, arr) => (
                      <Link
                        key={subcategory.id}
                        to={`/categories/${subcategory.slug}`}
                        className={`block px-3 py-2.5 text-sm text-gray-700 hover:text-header hover:bg-header/5 hover:border-l-4 hover:border-header transition-all font-medium ${
                          index !== arr.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                </nav>
              </div>

              {/* RIGHT CONTENT - Sub-subcategories or Category Banner */}
              <div className="flex-1 lg:pl-8">
                {/* Show sub-subcategories grouped by parent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
                  {hoveredCategoryData.children
                    .filter((child) => child.is_active && hasSubcategories(child))
                    .slice(0, 3) // Show max 3 columns
                    .map((subcategory) => (
                      <div key={subcategory.id}>
                        <h3 className="text-sm font-semibold mb-3">{subcategory.name}</h3>
                        <div className="space-y-2">
                          {subcategory.children
                            .filter((item) => item.is_active)
                            .slice(0, 6) // Show max 6 items per column
                            .map((item) => (
                              <Link
                                key={item.id}
                                to={`/categories/${item.slug}`}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-header cursor-pointer"
                              >
                                {item.icon && (
                                  <img
                                    src={getImageUrl(item.icon)}
                                    alt=""
                                    className="w-5 h-5 object-contain"
                                  />
                                )}
                                <span>{item.name}</span>
                              </Link>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Category Banner (if available) */}
                {hoveredCategoryData.banner && (
                  <div className="mt-6 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(hoveredCategoryData.banner)}
                      alt={`${hoveredCategoryData.name} Banner`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryNav
