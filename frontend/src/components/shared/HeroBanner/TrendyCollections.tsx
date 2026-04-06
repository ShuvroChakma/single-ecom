import React, { useState } from 'react';

interface ProductCategory {
  id: number;
  imageUrl: string;
  name: string;
}

interface CollectionCategory {
  id: string;
  label: string;
  products: Array<ProductCategory>;
}

const TrendyCollections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('rings');

  const collections: Array<CollectionCategory> = [
    {
      id: 'rings',
      label: 'Rings',
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Ring.jpg',
          name: 'Gold Ring'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Ring.jpg',
          name: 'Men Ring'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-ring.jpg',
          name: 'Kids Ring'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Ring.jpg',
          name: 'Designer Ring'
        }
      ]
    },
    {
      id: 'earrings',
      label: 'Earrings',
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Earring.jpg',
          name: 'Gold Earring'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Earring.jpg',
          name: 'Kids Earring'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Earring.jpg',
          name: 'Stud Earring'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Earring.jpg',
          name: 'Hoop Earring'
        }
      ]
    },
    {
      id: 'necklaces',
      label: 'Necklaces',
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Pendant.jpg',
          name: 'Gold Pendant'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Pendant.jpg',
          name: 'Men Pendant'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Pendant.jpg',
          name: 'Kids Pendant'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Pendant.jpg',
          name: 'Heart Pendant'
        }
      ]
    },
    {
      id: 'chains',
      label: 'Chains',
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Chain.jpg',
          name: 'Gold Chain'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Chain_1.jpg',
          name: 'Men Chain'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Bracelet.jpg',
          name: 'Bracelet Style'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Chain.jpg',
          name: 'Thin Chain'
        }
      ]
    }
  ];

  const activeCategory = collections.find(cat => cat.id === activeTab);

  return (
    <div className="w-full px-4 py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-light tracking-wide mb-5">
            Trendy Collections
          </h2>

          {/* Tabs */}
          <div className="flex justify-center items-center gap-4 md:gap-6 flex-wrap">
            {collections.map((category, index) => (
              <React.Fragment key={category.id}>
                <button
                  onClick={() => setActiveTab(category.id)}
                  className={`relative text-sm md:text-lg font-medium pb-2 transition-all duration-300
                    ${activeTab === category.id
                      ? 'text-header'
                      : 'text-gray-500 hover:text-header'
                    }`}
                >
                  {category.label}

                  {/* Animated underline */}
                  <span className={`absolute left-0 bottom-0 h-0.5 bg-header transition-all duration-300
                    ${activeTab === category.id ? 'w-full' : 'w-0 group-hover:w-full'}
                  `}></span>
                </button>

                {index < collections.length - 1 && (
                  <span className="text-gray-400">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {activeCategory?.products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Product Name */}
              {/* <div className="p-3 text-center">
                <p className="text-sm md:text-base font-medium text-gray-800 group-hover:text-header transition">
                  {product.name}
                </p>
              </div> */}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrendyCollections;