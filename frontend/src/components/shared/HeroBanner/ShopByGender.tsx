import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query'
import { getProductsByGender } from '@/api/products'
import { getImageUrl } from '@/api/client'
import { Link } from '@tanstack/react-router'

const tabs = [
  { id: 'women', label: "Women's Jewellery" },
  { id: 'men', label: "Men's Jewellery" },
  { id: 'kids', label: 'Kids Jewellery' },
]

const ShopByGender: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('women');

  const { data: womenData } = useQuery({
    queryKey: ['products-by-gender', 'WOMEN'],
    queryFn: () => getProductsByGender({ data: { gender: 'WOMEN', limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: menData } = useQuery({
    queryKey: ['products-by-gender', 'MEN'],
    queryFn: () => getProductsByGender({ data: { gender: 'MEN', limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: kidsData } = useQuery({
    queryKey: ['products-by-gender', 'KIDS'],
    queryFn: () => getProductsByGender({ data: { gender: 'KIDS', limit: 4 } }),
    staleTime: 5 * 60 * 1000,
  })

  const genderDataMap: Record<string, typeof womenData> = {
    women: womenData,
    men: menData,
    kids: kidsData,
  }

  return (
    <div className="w-full px-2 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-light mb-4 md:mb-6">Shop By Gender</h2>

          {/* Tab Navigation */}
          <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={` text-sm md:text-lg font-medium pb-2 transition-transform hover:border-b-header hover:border-b hover:text-header duration-500 cursor-pointer${
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

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3">
          {(() => {
            const activeData = genderDataMap[activeTab]
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
            // Skeleton loading / empty state
            return Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse" />
            ))
          })()}
        </div>
      </div>
    </div>
  );
};

export default ShopByGender;
