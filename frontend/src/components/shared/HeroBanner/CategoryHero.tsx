import React from 'react';

interface Category {
  id: number;
  name: string;
  image: string;
  mobileOnly?: boolean;
}

const CATEGORIES: Array<Category> = [
  // Show only on mobile/sm screens
  {
    id: 1,
    name: 'Diamond',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/diamond-offer.jpg',
    mobileOnly: true,
  },
  {
    id: 2,
    name: 'Gold',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/Gold-offer.jpg',
    mobileOnly: true,
  },
  {
    id: 3,
    name: 'Gemstone',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/12-dec/homepage/Gemstone-offer.jpg',
    mobileOnly: true,
  },

  // Main categories
  {
    id: 4,
    name: 'Best Sellers',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/05_may/india-homepage/focus-block/best-seller.jpg',
  },
  {
    id: 5,
    name: 'New Arrivals',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/05_may/india-homepage/focus-block/new-arrivals.jpg',
  },
  {
    id: 6,
    name: 'Coins & Bars',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/10_oct/diwali24/homepage/gold-bars-coins-focus.jpg',
  },
  {
    id: 7,
    name: 'Coin Pendants',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/10_oct/diwali24/homepage/gold-coin-pendant-focus.jpg',
  },
  {
    id: 8,
    name: 'Silver Coins',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/10_oct/diwali24/homepage/silver-bars-coins-focus.jpg',
  },
  {
    id: 9,
    name: 'Gold Jhumka',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/Gold-Jhumka.gif',
  },
  {
    id: 10,
    name: 'Ring',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/solitare.jpg',
  },
  {
    id: 11,
    name: 'Bangle',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Bangle-1.jpg',
  },
  {
    id: 12,
    name: 'Earring',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Offer.jpg',
  },
  {
    id: 13,
    name: 'Mangalsutra',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/02_feb/ind-homepage/category-slider/Mangalsutra.jpg',
  },
  {
    id: 14,
    name: 'Gold Chain',
    image:
      'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2022/04_april/mobilesubcategory/new/Chain-1.jpg',
  },
];

export default function CategoryHero() {
  return (
    <div className="w-full py-4">
      <div className="max-w-7xl mx-auto">
        {/* Mobile to md: scrollable | lg+: flex-wrap */}
        <div
          className="
            flex
            overflow-x-auto
            lg:overflow-visible
            gap-3 sm:gap-2.5 lg:gap-0
            pb-3 px-1 sm:px-2

            lg:flex-wrap
            lg:justify-between
          "
          style={
            {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties
          }
        >
          {CATEGORIES.map((category) => {
            // On lg+, skip mobile-only items
            if (category.mobileOnly) {
              return (
                <div
                  key={category.id}
                  className="lg:hidden flex flex-col items-center shrink-0 min-w-20 sm:min-w-[90px]"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shadow-md bg-white">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center text-gray-800 whitespace-nowrap mt-1">
                    {category.name}
                  </span>
                </div>
              );
            }

            // Default rendering for all main 11 items
            return (
              <div
                key={category.id}
                className="
                  flex flex-col items-center shrink-0 min-w-20 sm:min-w-[90px]
                "
              >
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-center text-gray-800 whitespace-nowrap mt-1">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}