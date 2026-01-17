import { useState } from "react"
import { Link, useRouter } from "@tanstack/react-router"

// Define types for better type safety
type CategorySlug = "diamond" | "gold" | "gemstone"

interface CategoryItem {
  name: string
  icon: string
}

interface CategoryColumn {
  title: string
  items: Array<CategoryItem>
}

interface CategoryDropdownData {
  columns: Array<CategoryColumn>
  leftMenu: Array<string>
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
}

const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<CategorySlug | null>(null)
  

  const categories = [
    { name: "DIAMOND", slug: "diamond" as CategorySlug, hasDropdown: true, path:'/categories/diamond' },
    { name: "GOLD", slug: "gold" as CategorySlug, hasDropdown: true, path:'/categories/gold' },
    { name: "GEMSTONE", slug: "gemstone" as CategorySlug, hasDropdown: true, path:'/categories/gemstone' },
    { name: "UNCUT DIAMOND", slug: "uncut-diamond", hasDropdown: false, path:'/categories/uncut-diamond' },
    { name: "PLATINUM", slug: "platinum", hasDropdown: false, path:'/categories/platinum' },
    { name: "GOLD COINS", slug: "gold-coins", hasDropdown: false, path:'/categories/gold-coins' },
    { name: "SILVER", slug: "silver", hasDropdown: false, path:'/categories/silver' },
    { name: "WATCHES", slug: "watches", hasDropdown: false, path:'/categories/watches' },
    { name: "GIFTS", slug: "gifts", hasDropdown: false, path:'/categories/gifts' },
    { name: "JEWELLERY", slug: "jewellery", hasDropdown: false, path:'/categories/jewellery' },
    { name: "GIFT CARDS", slug: "gift-cards", hasDropdown: false, path:'/categories/gift-cards' },
    { name: "GOLD RATE", slug: "gold-rate", hasDropdown: false, path:'/categories/gold-rate' },
  ]

  return (
    <div className="relative">
      {/* CATEGORY BAR */}
      <nav className="hidden lg:block sticky top-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-start lg:justify-center min-w-max lg:min-w-0 px-4 lg:px-0">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="relative shrink-0"
                  onMouseEnter={() =>
                    category.hasDropdown &&
                    category.slug in categoryData &&
                    setHoveredCategory(category.slug as CategorySlug)
                  }
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={category.path}
                    className="px-2 xl:px-3 py-4 text-xs xl:text-sm font-medium text-gray-700 hover:text-header transition-colors border-b-2 border-transparent hover:border-header inline-block cursor-pointer whitespace-nowrap"
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* MEGA MENU */}
      {hoveredCategory && hoveredCategory in categoryData && (
        <div
          className="absolute left-0 right-0 top-full bg-white shadow-2xl border-t border-gray-200 z-50"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row py-6 lg:py-8 gap-6 lg:gap-0">
              {/* LEFT MENU */}
              <div className="w-full lg:w-48 lg:pr-8 lg:border-r-2 border-gray-200">
                <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1">
                  {categoryData[hoveredCategory].leftMenu.map((item, index) => (
                    <Link
                      key={item}
                      to={`/categories/${hoveredCategory}/${item
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      className={`block px-3 py-2.5 text-sm text-gray-700 hover:text-header hover:bg-header/5 hover:border-l-4 hover:border-header transition-all font-medium ${
                        index !==
                        categoryData[hoveredCategory].leftMenu.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 lg:pl-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
                  {categoryData[hoveredCategory].columns.map((column) => (
                    <div key={column.title}>
                      <h3 className="text-sm font-semibold mb-3">
                        {column.title}
                      </h3>
                      <div className="space-y-2">
                        {column.items.map((item) => (
                          <Link
                            key={item.name}
                            to={`/categories/${hoveredCategory}/${item.name
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-header cursor-pointer"
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryNav
