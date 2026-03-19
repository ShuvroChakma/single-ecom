import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSlides } from '@/api/slides';
import { SLIDE_POSITIONS } from '@/api/slidePositions';
import { getImageUrl } from '@/api/client';

interface CollectionItem {
  id: string;
  imageUrl: string;
  alt: string;
  href: string | null;
}

const OurCollection: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.OUR_COLLECTION],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.OUR_COLLECTION } }),
    staleTime: 5 * 60 * 1000,
  });

  const collections: Array<CollectionItem> =
    data?.success && data.data.length > 0
      ? data.data.map((s) => ({
          id: s.id,
          imageUrl: getImageUrl(s.image_url, ''),
          alt: s.title,
          href: s.link_url,
        }))
      : [];

  if (!collections.length) return null;

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
            <a
              key={item.id}
              href={item.href || '#'}
              className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-200 hover:scale-102 cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-4">
          {collections.map((item) => (
            <a
              key={item.id}
              href={item.href || '#'}
              className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 active:scale-95 cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="w-full h-auto object-cover"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollection;
