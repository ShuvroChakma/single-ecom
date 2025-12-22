import React from "react"

interface GoldCategory {
  id: number
  title: string
  image: string
}

const GOLD_CATEGORIES: Array<GoldCategory> = [
  {
    id: 1,
    title: "Elegant Chains",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-chain-w.jpg",
  },
  {
    id: 2,
    title: "Stunning Ring",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-rings-w.jpg",
  },
  {
    id: 3,
    title: "Modern Mangalsutras",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-mangalsutra-w.jpg",
  },
  {
    id: 4,
    title: "Trendy Pendants",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-pendant-w.jpg",
  },
  {
    id: 5,
    title: "Gorgeous Bangles",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-bangles-w.jpg",
  },
  {
    id: 6,
    title: "Stylish Earrings",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/03_March/ind-homepage-gold-jewellery/gold-earring-w.jpg",
  },
]

const GoldJewellery: React.FC = () => {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-gray-900">
            Gold Jewellery
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Fine jewellery for life&apos;s meaningful moments
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {GOLD_CATEGORIES.map((item) => (
            <div key={item.id} className="w-full">
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  md:rounded-full
                "
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="
                    w-full
                    h-full
                    object-cover
                    transition-transform
                    duration-500
                    hover:scale-105
                  "
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GoldJewellery
