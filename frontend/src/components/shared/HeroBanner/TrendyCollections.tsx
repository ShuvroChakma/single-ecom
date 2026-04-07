import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query'
import { getProductsByCategory } from '@/api/products'
import { getImageUrl } from '@/api/client'
import { Link } from '@tanstack/react-router'

const tabs = [
  { id: 'necklaces', label: 'Necklaces', categoryId: '1' },
  { id: 'earrings', label: 'Earrings', categoryId: '2' },
  { id: 'bangles', label: 'Bangles', categoryId: '3' },
  { id: 'rings', label: 'Rings', categoryId: '4' },
]

const TrendyCollections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('necklaces');

  const { data: necklacesData } = useQuery({
    queryKey: ['products-by-category', tabs[0].categoryId],
    queryFn: () => getProductsByCategory({ data: { categoryId: tabs[0].categoryId, limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: earringsData } = useQuery({
    queryKey: ['products-by-category', tabs[1].categoryId],
    queryFn: () => getProductsByCategory({ data: { categoryId: tabs[1].categoryId, limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: banglesData } = useQuery({
    queryKey: ['products-by-category', tabs[2].categoryId],
    queryFn: () => getProductsByCategory({ data: { categoryId: tabs[2].categoryId, limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: ringsData } = useQuery({
    queryKey: ['products-by-category', tabs[3].categoryId],
    queryFn: () => getProductsByCategory({ data: { categoryId: tabs[3].categoryId, limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const categoryDataMap: Record<string, typeof necklacesData> = {
    necklaces: necklacesData,
    earrings: earringsData,
    bangles: banglesData,
    rings: ringsData,
  }

  return (
    <div className="w-full px-2 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-light mb-4 md:mb-6">Trendy Collections</h2>
          <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm md:text-lg font-medium pb-2 transition-transform hover:border-b-header hover:border-b hover:text-header duration-500 cursor-pointer${
                    activeTab === tab.id
                      ? ' text-header border-header border-b hover:origin-left duration-300'
                      : ' text-footer_dark hover:text-header hover:border-header'
                  }`}
                >
                  {tab.label}
                </button>
                {index < tabs.length - 1 && (
                  <span className="text-footer_dark font-bold">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3">
          {(() => {
            const activeData = categoryDataMap[activeTab]
            if (activeData?.success && activeData.data.items.length > 0) {
              return activeData.data.items.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}-${product.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getImageUrl(product.images?.[0], '/placeholder-product.jpg')}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-center p-2 truncate text-gray-700">{product.name}</p>
                </Link>
              ))
            }
            return Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse" />
            ))
          })()}
        </div>
      </div>
    </div>
  );
};

export default TrendyCollections;