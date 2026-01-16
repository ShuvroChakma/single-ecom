import React from 'react';

interface CollectionItem {
  id: number;
  imageUrl: string;
  alt: string;
}

const OurCollection: React.FC = () => {
  const collections: Array<CollectionItem> = [
    {
      id: 1,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/06_june/homepage-our-collection/Legendz-collection-1.jpg',
      alt: 'Legendz Collection'
    },
    {
      id: 2,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/06_june/homepage-our-collection/kids-collection-1.jpg',
      alt: 'Starlet Kids Collection'
    },
    {
      id: 3,
      imageUrl: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/06_june/homepage-our-collection/Sankha-Pola-1.jpg',
      alt: 'Sankha Pola Collection'
    }
  ];

  return (
    <div className="w-full px-2 py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-serif mb-2">Our Collection</h2>
          <p className="text-sm md:text-base text-gray-700">
            Discover our latest jewellery collection!
          </p>
        </div>

        {/* Desktop/Tablet Layout (md and up) */}
        <div className="hidden md:grid md:grid-cols-3 gap-2 lg:gap-4">
          {collections.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-4">
          {collections.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 active:scale-95 cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollection;