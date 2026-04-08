import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { getFeaturedCategories } from '@/api/categories'
import { getProductsByCategory } from '@/api/products'
import { getImageUrl } from '@/api/client'

const TrendyCollections: React.FC = () => {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const { data: categoriesData } = useQuery({
    queryKey: ['featured-categories'],
    queryFn: () => getFeaturedCategories(),
    staleTime: 10 * 60 * 1000,
  })

  const categories = categoriesData?.success ? categoriesData.data : []

  // Set first category as active once loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  const { data: productsData } = useQuery({
    queryKey: ['products-by-category', activeCategoryId],
    queryFn: () => getProductsByCategory({ data: { categoryId: activeCategoryId!, limit: 4 } }),
    enabled: !!activeCategoryId,
    staleTime: 5 * 60 * 1000,
  })

  const products = productsData?.success ? productsData.data.items : []

  return (
    <div className="w-full px-2 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-light mb-4 md:mb-6">Trendy Collections</h2>

          {categories.length > 0 && (
            <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap">
              {categories.map((cat, index) => (
                <React.Fragment key={cat.id}>
                  <button
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`text-sm md:text-lg font-medium pb-2 transition-transform hover:border-b-header hover:border-b hover:text-header duration-500 cursor-pointer${
                      activeCategoryId === cat.id
                        ? ' text-header border-header border-b hover:origin-left duration-300'
                        : ' text-footer_dark hover:text-header hover:border-header'
                    }`}
                  >
                    {cat.name}
                  </button>
                  {index < categories.length - 1 && (
                    <span className="text-footer_dark font-bold">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3">
          {products.length > 0
            ? products.map((product) => (
                <Link
                  key={product.id}
                  to="/products/$slug"
                  params={{ slug: `${product.slug}-${product.id}` }}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getImageUrl(product.images[0], '/placeholder-product.jpg')}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-center p-2 truncate text-gray-700">{product.name}</p>
                </Link>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse" />
              ))}
        </div>
      </div>
    </div>
  )
}

export default TrendyCollections
