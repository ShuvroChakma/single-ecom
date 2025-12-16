import { useState } from "react";

// Define types for better type safety
type CategorySlug = "diamond" | "gold" | "gemstone";

interface CategoryItem {
  name: string;
  icon: string;
}

interface CategoryColumn {
  title: string;
  items: Array<CategoryItem>;
}

interface CategoryDropdownData {
  columns: Array<CategoryColumn>;
  leftMenu: Array<string>;
}

// Mock data structure - replace with your backend data later
const categoryData: Record<CategorySlug, CategoryDropdownData> = {
  diamond: {
    columns: [
      {
        title: "Shop By Style",
        items: [
          { name: "Bands", icon: "💍" },
          { name: "Stackable", icon: "💎" },
          { name: "Cocktail", icon: "🍸" },
          { name: "Eternity", icon: "♾️" },
        ],
      },
      {
        title: "Wearing Type",
        items: [
          { name: "Daily Wear", icon: "👔" },
          { name: "Office Wear", icon: "💼" },
          { name: "Casual Wear", icon: "👕" },
          { name: "Party Wear", icon: "🎉" },
        ],
      },
      {
        title: "Shop By Metal",
        items: [
          { name: "Yellow Gold", icon: "🟡" },
          { name: "White Gold", icon: "⚪" },
          { name: "Rose Gold", icon: "🟠" },
          { name: "Two Tone", icon: "🔶" },
        ],
      },
    ],
    leftMenu: [
      "Rings",
      "Earrings",
      "Pendants",
      "Nosepins",
      "Necklaces",
      "Bangles",
      "Bracelets",
      "Mangalsutras",
      "Mens",
      "Collection",
    ],
  },
  gold: {
    columns: [
      {
        title: "Shop By Style",
        items: [
          { name: "Traditional", icon: "🕉️" },
          { name: "Contemporary", icon: "✨" },
          { name: "Antique", icon: "🏺" },
          { name: "Designer", icon: "💫" },
        ],
      },
      {
        title: "Purity",
        items: [
          { name: "22K Gold", icon: "🟡" },
          { name: "18K Gold", icon: "🟠" },
          { name: "24K Gold", icon: "🌟" },
        ],
      },
    ],
    leftMenu: [
      "Rings",
      "Earrings",
      "Necklaces",
      "Chains",
      "Bangles",
      "Bracelets",
      "Pendants",
    ],
  },
  gemstone: {
    columns: [
      {
        title: "By Gemstone",
        items: [
          { name: "Ruby", icon: "🔴" },
          { name: "Emerald", icon: "🟢" },
          { name: "Sapphire", icon: "🔵" },
          { name: "Pearl", icon: "⚪" },
        ],
      },
    ],
    leftMenu: ["Rings", "Earrings", "Pendants", "Necklaces"],
  },
};

const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<CategorySlug | null>(null);

  const categories = [
    { name: "DIAMOND", slug: "diamond" as CategorySlug, hasDropdown: true },
    { name: "GOLD", slug: "gold" as CategorySlug, hasDropdown: true },
    { name: "GEMSTONE", slug: "gemstone" as CategorySlug, hasDropdown: true },
    { name: "UNCUT DIAMOND", slug: "uncut-diamond", hasDropdown: false },
    { name: "PLATINUM", slug: "platinum", hasDropdown: false },
    { name: "GOLD COINS", slug: "gold-coins", hasDropdown: false },
    { name: "SILVER", slug: "silver", hasDropdown: false },
    { name: "WATCHES", slug: "watches", hasDropdown: false },
    { name: "GIFTS", slug: "gifts", hasDropdown: false },
    { name: "JEWELLERY", slug: "jewellery", hasDropdown: false },
    { name: "GIFT CARDS", slug: "gift-cards", hasDropdown: false },
    { name: "GOLD RATE", slug: "gold-rate", hasDropdown: false },
  ];

  return (
    <div className="relative">
      <nav className="hidden lg:block bg-white border-b border-gray-200 shadow-sm relative z-40">
        <div className="w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-start lg:justify-center min-w-max lg:min-w-0 px-4 lg:px-0">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="relative shrink-0"
                  onMouseEnter={() =>
                    category.hasDropdown && category.slug in categoryData && setHoveredCategory(category.slug as CategorySlug)
                  }
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <span className="px-2 xl:px-3 py-4 text-xs xl:text-sm font-medium text-gray-700 hover:text-[#960365] transition-colors border-b-2 border-transparent hover:border-[#960365] inline-block cursor-pointer whitespace-nowrap">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mega Menu Dropdown - Positioned absolutely below nav */}
      {hoveredCategory && hoveredCategory in categoryData && (
        <div
          className="absolute left-0 right-0 top-full bg-white shadow-2xl border-t border-gray-200 z-50"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row py-6 lg:py-8 gap-6 lg:gap-0">
              {/* Left Sidebar Menu */}
              <div className="w-full lg:w-48 lg:pr-8 lg:border-r-2 border-gray-200">
                <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-0">
                  {categoryData[hoveredCategory].leftMenu.map((item, index) => (
                    <a
                      key={item}
                      href={`/${hoveredCategory}/${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`block px-3 py-2.5 text-sm text-gray-700 hover:text-[#960365] hover:bg-[#960365]/5 hover:border-l-4 hover:border-[#960365] transition-all cursor-pointer font-medium ${
                        index !== categoryData[hoveredCategory].leftMenu.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Main Content Grid */}
              <div className="flex-1 lg:pl-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
                  {categoryData[hoveredCategory].columns.map((column, idx) => (
                    <div key={idx}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 lg:mb-4">
                        {column.title}
                      </h3>
                      <div className="space-y-2 lg:space-y-3">
                        {column.items.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-2 lg:gap-3 text-sm text-gray-600 hover:text-[#960365] transition-colors group cursor-pointer"
                          >
                            <span className="text-lg lg:text-xl group-hover:scale-110 transition-transform shrink-0">
                              {item.icon}
                            </span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional sections */}
                {hoveredCategory === "diamond" && (
                  <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#960365] transition-colors cursor-pointer">
                        <span className="text-lg shrink-0">💫</span>
                        <span>Casual</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#960365] transition-colors cursor-pointer">
                        <span className="text-lg shrink-0">💎</span>
                        <span>Solitaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#960365] transition-colors cursor-pointer">
                        <span className="text-lg shrink-0">💍</span>
                        <span>Broad Rings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#960365] transition-colors cursor-pointer">
                        <span className="text-lg shrink-0">👶</span>
                        <span>For Kids</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryNav;