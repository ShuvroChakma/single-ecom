// HandPicked.tsx
// Responsive "Handpicked Just For You" component
// React + TypeScript + TailwindCSS (CMS-driven images)

import React from "react"
import { useQuery } from '@tanstack/react-query'
import { getSlides } from '@/api/slides'
import { SLIDE_POSITIONS } from '@/api/slidePositions'
import { getImageUrl } from '@/api/client'

export type HandpickedImage = {
  src: string
  alt: string
  title: string
  subtitle?: string
}

// 👉 Props are OPTIONAL so <HandPicked /> is safe
export interface HandPickedProps {
  heading?: string
  description?: string
}

const EMPTY_IMAGE: HandpickedImage = {
  src: "",
  alt: "",
  title: "",
}

/* =====================
   IMAGE TILE
===================== */

const ImageTile: React.FC<{
  data: HandpickedImage
  className?: string
}> = ({ data, className }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <img
        src={data.src}
        alt={data.alt}
        loading="lazy"
        className="h-full w-full object-fill"
      />
    </div>
  )
}

/* =====================
   COMPONENT
===================== */

export const HandPicked: React.FC<HandPickedProps> = ({
  heading = "Handpicked Just For You!",
  description = "Our lightweight collection keeps you stylish and comfortable from dawn to dusk.",
}) => {
  const { data } = useQuery({
    queryKey: ['slides', SLIDE_POSITIONS.HAND_PICKED],
    queryFn: () => getSlides({ data: { position: SLIDE_POSITIONS.HAND_PICKED } }),
    staleTime: 5 * 60 * 1000,
  })

  const slides = data?.success ? data.data : []

  if (!slides.length) return null

  const left: HandpickedImage = slides[0]
    ? { src: getImageUrl(slides[0].image_url, ''), alt: slides[0].title, title: slides[0].title }
    : EMPTY_IMAGE

  const topRight: HandpickedImage = slides[1]
    ? { src: getImageUrl(slides[1].image_url, ''), alt: slides[1].title, title: slides[1].title }
    : EMPTY_IMAGE

  const bottomRight: HandpickedImage = slides[2]
    ? { src: getImageUrl(slides[2].image_url, ''), alt: slides[2].title, title: slides[2].title }
    : EMPTY_IMAGE

  return (
    <section className="mx-auto max-w-7xl px-2 md:px-2 lg:px-2 py-6 md:py-8">
      {/* Header */}
      <div className="text-center mb-5 md:mb-8">
        <h2 className="text-2xl md:text-3xl xl:text-4xl font-serif">
          {heading}
        </h2>
        {description && (
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left container – takes full height */}
        <div className="lg:col-span-2">
          <div className="h-[460px] md:h-[520px] lg:h-[480px]">
            <ImageTile data={left} className="h-full" />
          </div>
        </div>

        {/* Right container – SAME height, split into 2 equal rows */}
        <div className="lg:col-span-1">
          <div className="h-[460px] md:h-[520px] lg:h-[480px] grid grid-rows-2 gap-4">
            <ImageTile data={topRight} className="h-full" />
            <ImageTile data={bottomRight} className="h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* =====================
   USAGE
===================== */

// <HandPicked />
// CMS driven example:
// <HandPicked heading="Custom heading" description="Custom description" />
