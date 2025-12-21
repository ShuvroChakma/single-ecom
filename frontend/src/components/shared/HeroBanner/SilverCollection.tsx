// SilverCollection.tsx
// Image-only Silver Collection section (clickable)
// React + TypeScript + TailwindCSS
// Images come from backend (using provided CDN links for now)

import React from "react"

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

export interface SilverCollectionProps {
  silverCards?: Array<SilverCard>
  earringCategories?: Array<EarringCategory>
}

/* =====================
   DEFAULT DATA
===================== */

const DEFAULT_SILVER_CARDS: Array<SilverCard> = [
  {
    id: "coins-bars",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/09-sep/homepage/shagun-coins/Silver-coin-bar.jpg",
    href: "#",
  },
  {
    id: "articles",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/09-sep/homepage/shagun-coins/Silver-Silver.jpg",
    href: "#",
  },
]

const DEFAULT_EARRINGS: Array<EarringCategory> = [
  {
    id: "studs",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/04_april/ind-homepage/akshaya-tritiya/earring-collection/Studs.jpg",
    href: "#",
  },
  {
    id: "jhumkas",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/04_april/ind-homepage/akshaya-tritiya/earring-collection/Jhumkas.jpg",
    href: "#",
  },
  {
    id: "drops",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/04_april/ind-homepage/akshaya-tritiya/earring-collection/Drops.jpg",
    href: "#",
  },
  {
    id: "hoops",
    image:
      "https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/04_april/ind-homepage/akshaya-tritiya/earring-collection/Hoops.jpg",
    href: "#",
  },
]

/* =====================
   COMPONENT
===================== */

export const SilverCollection: React.FC<SilverCollectionProps> = ({
  silverCards = DEFAULT_SILVER_CARDS,
  earringCategories = DEFAULT_EARRINGS,
}) => {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
  {/* ================= Silver Heading ================= */}
  <div className="text-center mb-8">
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
  <div className="text-center mb-8">
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
