import React, { useState } from 'react';

interface ProductCategory {
  id: number;
  imageUrl: string;
  name: string;
}

interface GenderCategory {
  id: string;
  label: string;
  products: Array<ProductCategory>;
}

const ShopByGender: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('women');

  const genderCategories: Array<GenderCategory> = [
    {
      id: 'women',
      label: "Women's Jewellery",
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Ring.jpg',
          name: 'Gold Ring'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Earring.jpg',
          name: 'Gold Earring'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Pendant.jpg',
          name: 'Gold Pendant'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/w/Gold-Chain.jpg',
          name: 'Gold Chain'
        }
      ]
    },
    {
      id: 'men',
      label: "Men's Jewellery",
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Ring.jpg',
          name: 'Gold Ring'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Pendant.jpg',
          name: 'Gold Pendant'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold--kada.jpg',
          name: 'Gold Kada'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/m/Gold-Chain_1.jpg',
          name: 'Gold Chain'
        }
      ]
    },
    {
      id: 'kids',
      label: 'Kids Jewellery',
      products: [
        {
          id: 1,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-ring.jpg',
          name: 'Gold Ring'
        },
        {
          id: 2,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Earring.jpg',
          name: 'Gold Earring'
        },
        {
          id: 3,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Pendant.jpg',
          name: 'Gold Pendant'
        },
        {
          id: 4,
          imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/shop-by-gender/k/Gold-Bracelet.jpg',
          name: 'Gold Bracelet'
        }
      ]
    }
  ];

  const activeCategory = genderCategories.find(cat => cat.id === activeTab);

  return (
    <div className="w-full px-2 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-light mb-4 md:mb-6">Shop By Gender</h2>
          
          {/* Tab Navigation */}
          <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap">
            {genderCategories.map((category, index) => (
              <React.Fragment key={category.id}>
                <button
                  onClick={() => setActiveTab(category.id)}
                  className={` text-sm md:text-lg font-medium pb-2 transition-transform hover:border-b-header hover:border-b hover:text-header duration-500 cursor-pointer${
                    activeTab === category.id
                      ? ' text-header border-header border-b hover:origin-left duration-300'
                      : ' text-footer_dark hover:text-header hover:border-header'
                  }`}
                >
                  {category.label}
                </button>
                {index < genderCategories.length - 1 && (
                  <span className="text-footer_dark font-bold">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3">
          {activeCategory?.products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                />
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopByGender;