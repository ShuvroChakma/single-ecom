import React from "react"
import { useQuery } from "@tanstack/react-query"
import { getSlides } from "@/api/slides"
import { SLIDE_POSITIONS } from "@/api/slidePositions"
import { getImageUrl } from "@/api/client"


const GoldJewellery: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["slides", SLIDE_POSITIONS.GOLD_JEWELLERY],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.GOLD_JEWELLERY } }),
    staleTime: 5 * 60 * 1000,
  })

  const items =
    data?.success && data.data.length > 0
      ? data.data.map((s) => ({
          id: s.id,
          title: s.title,
          image: getImageUrl(s.image_url, ""),
          href: s.link_url,
        }))
      : []

  if (!items.length) return null

  return (
    <section className="w-full py-12 px-2 sm:px-2 lg:px-2">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {items.map((item) => (
            <a key={item.id} href={item.href || '#'} className="w-full">
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
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GoldJewellery
