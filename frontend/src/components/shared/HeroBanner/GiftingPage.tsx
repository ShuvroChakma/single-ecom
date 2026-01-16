import React from 'react';

interface JewelryItem {
  id: number;
  imageUrl: string;
  label: string;
}

const GiftingPage: React.FC = () => {
  // Jewelry items from Malabar Gold & Diamonds
  const jewelryItems: Array<JewelryItem> = [
    {
      id: 1,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/Birthday.jpg',
      label: 'Birthday'
    },
    {
      id: 2,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/anniversary.jpg',
      label: 'Anniversary'
    },
    {
      id: 3,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/baby-birth.jpg',
      label: 'Baby Birth'
    },
    {
      id: 4,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/festive.jpg',
      label: 'Festive collection'
    },
    {
      id: 5,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/Personalized.jpg',
      label: 'Personalised Jewellery'
    },
    {
      id: 6,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2023/06_June/homepage/gifting-block/Customized.jpg',
      label: 'Customized Jewellery'
    }
  ];

  return (
    <div className="w-full bg-white py-8 px-2 sm:px-4 md:px-2 lg:px-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">Gifting & More</h1>
          <p className="text-gray-600 text-sm md:text-base">Gifts that mark a moment</p>
        </div>

        {/* Desktop Grid (md and above) */}
        <div className="hidden md:flex gap-2 lg:gap-4">
          {/* Left section: First 4 items in 2x2 grid */}
          <div className="w-1/2 grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4">
            {jewelryItems.slice(0, 4).map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-lg cursor-pointer h-40 lg:h-50">
                <img
                  src={item.imageUrl}
                  
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Right section: Last 2 items side by side - each spans full height */}
          <div className="w-1/2 grid grid-cols-2 gap-2 lg:gap-4">
            {jewelryItems.slice(4, 6).map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-lg cursor-pointer h-84 lg:h-104">
                <img
                  src={item.imageUrl}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Grid (below md) */}
        <div className="md:hidden grid grid-cols-2 gap-2.5">
          {jewelryItems.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={item.imageUrl}
                
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GiftingPage;