import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSlides } from '@/api/slides';
import { SLIDE_POSITIONS } from '@/api/slidePositions';
import { getImageUrl } from '@/api/client';

interface JewelryItem {
  id: string;
  imageUrl: string;
  label: string;
  href: string | null;
}

const GiftingPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.GIFTING],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.GIFTING } }),
    staleTime: 5 * 60 * 1000,
  });

  const jewelryItems: Array<JewelryItem> =
    data?.success && data.data.length > 0
      ? data.data.map((s) => ({
          id: s.id,
          imageUrl: getImageUrl(s.image_url, ''),
          label: s.title,
          href: s.link_url,
        }))
      : [];

  if (!jewelryItems.length) return null;

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
              <a key={item.id} href={item.href || '#'} className="relative overflow-hidden rounded-lg cursor-pointer h-40 lg:h-50">
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>

          {/* Right section: Last 2 items side by side - each spans full height */}
          <div className="w-1/2 grid grid-cols-2 gap-2 lg:gap-4">
            {jewelryItems.slice(4, 6).map((item) => (
              <a key={item.id} href={item.href || '#'} className="relative overflow-hidden rounded-lg cursor-pointer h-84 lg:h-104">
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Mobile Grid (below md) */}
        <div className="md:hidden grid grid-cols-2 gap-2.5">
          {jewelryItems.map((item) => (
            <a
              key={item.id}
              href={item.href || '#'}
              className="relative overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GiftingPage;
