// SilverCollection.tsx
// Image-only Silver Collection section (clickable)
// React + TypeScript + TailwindCSS
// Images come from backend (using provided CDN links for now)

import React from "react"
import { useQuery } from '@tanstack/react-query'
import { getSlides } from '@/api/slides'
import { SLIDE_POSITIONS } from '@/api/slidePositions'
import { getImageUrl } from '@/api/client'

/* =====================
   TYPES
===================== */

export interface SilverCard {
  id: string
  image: string
  href?: string
}

export interface EarringCategory {
  id: string
  image: string
  href?: string
}

/* =====================
   COMPONENT
===================== */

export const SilverCollection: React.FC = () => {
  const { data: silverData } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.SILVER_BANNER],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.SILVER_BANNER } }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: earringData } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.EARRING_COLLECTION],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.EARRING_COLLECTION } }),
    staleTime: 5 * 60 * 1000,
  })

  const silverCards = silverData?.success && silverData.data.length > 0
    ? silverData.data.map(s => ({ id: s.id, image: getImageUrl(s.image_url, ''), href: s.link_url || '#' }))
    : []

  const earringCategories = earringData?.success && earringData.data.length > 0
    ? earringData.data.map(s => ({ id: s.id, image: getImageUrl(s.image_url, ''), href: s.link_url || '#' }))
    : []

  if (!silverCards.length && !earringCategories.length) return null

  return (
    <section className="mx-auto max-w-7xl px-2 md:px-2 py-10 md:py-8">
  {/* ================= Silver Heading ================= */}
  <div className="text-center mb-6">
    <h2 className="text-2xl md:text-3xl xl:text-4xl font-serif">
      Silver Collection
    </h2>
    <p className="mt-2 text-sm md:text-base text-muted-foreground">
      Where tradition meets silver sophistication!
    </p>
  </div>

  {/* ================= Top Silver Images ================= */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
    {silverCards.map((card) => (
      <a
        key={card.id}
        href={card.href || "#"}
        className="block overflow-hidden rounded-2xl"
      >
        <img
          src={card.image}
          alt="Silver collection"
          loading="lazy"
          className="w-full h-auto object-contain"
        />
      </a>
    ))}
  </div>

  {/* ================= Earring Heading ================= */}
  <div className="text-center mb-6">
    <h2 className="text-2xl md:text-3xl xl:text-4xl font-serif">
      Earring Collection
    </h2>
    <p className="mt-2 text-sm md:text-base text-muted-foreground">
      Our Exclusive Earring Collection
    </p>
  </div>

  {/* ================= Bottom Earring Images ================= */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {earringCategories.map((item) => (
      <a
        key={item.id}
        href={item.href || "#"}
        className="block overflow-hidden rounded-xl"
      >
        <img
          src={item.image}
          alt="Earring collection"
          loading="lazy"
          className="w-full h-auto object-contain"
        />
      </a>
    ))}
  </div>
</section>

  )
}

export default SilverCollection
