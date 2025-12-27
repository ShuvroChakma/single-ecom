import React from "react"

interface PlatinumBanner {
  id: number
  image: string
  alt: string
  link?: string
}

const PLATINUM_BANNERS: Array<PlatinumBanner> = [
  {
    id: 1,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/12-dec/home/MSD-collection.jpg",
    alt: "MS Dhoni Platinum Collection",
    link: "#",
  },
  {
    id: 2,
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2024/12-dec/home/Men-in-Platinum.jpg",
    alt: "Men in Platinum Rings Collection",
    link: "#",
  },
]

const PlatinumCollection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-2 py-8">
      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Platinum Collection
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Refine elegance with forever gleaming beauties
        </p>
      </div>

      {/* Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATINUM_BANNERS.map((banner) => (
          <a
            key={banner.id}
            href={banner.link}
            className="group block relative overflow-hidden rounded-2xl"
          >
            <img
              src={banner.image}
              alt={banner.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Optional overlay for future CMS text */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </a>
        ))}
      </div>
    </section>
  )
}

export default PlatinumCollection
