import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {  getHomeCarouselSlides } from '@/api/slides'

export default function Carousel() {
  const { data: slidesResponse, isLoading } = useQuery({
    queryKey: ['home-carousel-slides'],
    queryFn: () => getHomeCarouselSlides(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const slides = slidesResponse?.data || []
  const [index, setIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  const slideCount = slides.length
  const dragThreshold = 40
  const isFirstSlide = index === 0
  const isLastSlide = index === slideCount - 1

  /* ---------- AUTO PLAY ---------- */
  useEffect(() => {
    if (isDragging) return

    const timer = setInterval(() => {
      setIndex((prev) => {
        // If we're on the last slide, reset to first
        if (prev === slideCount - 1) {
          return 0
        }
        // Otherwise go to next
        return prev + 1
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [isDragging, slideCount])

  if (!isLoading && !slides.length) return null

  /* ---------- DRAG HANDLERS ---------- */
  const handleStart = (x: number) => {
    setIsDragging(true)
    setStartX(x)
    setCurrentX(x)
  }

  const handleMove = (x: number) => {
    if (!isDragging) return
    setCurrentX(x)
    const dragDistance = x - startX

    // Prevent dragging right on first slide
    if (isFirstSlide && dragDistance > 0) {
      setOffsetX(0)
      return
    }

    // Prevent dragging left on last slide
    if (isLastSlide && dragDistance < 0) {
      setOffsetX(0)
      return
    }

    setOffsetX(dragDistance)
  }

  const handleEnd = () => {
    if (!isDragging) return

    const dragDistance = currentX - startX

    if (Math.abs(dragDistance) > dragThreshold) {
      if (dragDistance < 0 && !isLastSlide) {
        // Dragged left - go to next (only if not on last slide)
        setIndex((prev) => prev + 1)
      } else if (dragDistance > 0 && !isFirstSlide) {
        // Dragged right - go to previous (only if not on first slide)
        setIndex((prev) => prev - 1)
      }
    }

    setIsDragging(false)
    setOffsetX(0)
    setStartX(0)
    setCurrentX(0)
  }

  // Arrow clicks work infinitely (wrap around)
  const goToPrev = () => {
    setIndex((i) => (i - 1 + slideCount) % slideCount)
  }

  const goToNext = () => {
    setIndex((i) => (i + 1) % slideCount)
  }

  return (
    <div className="w-full">
      {/* SLIDER */}
      <div
      className="relative group overflow-hidden w-screen h-[180px]
      xs:h-[220px]
      sm:h-[300px]
      md:h-[420px]
      lg:h-[600px]"
      
        style={{
          cursor: 'default',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {/* TRACK */}
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${index * 100}vw + ${isDragging ? offsetX : 0}px))`,
            transition: isDragging
              ? 'none'
              : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-screen h-full shrink-0">
              <img
                src={slide.image_url}
                alt={slide.title}
                draggable={false}
                className="w-full h-full object-fill select-none"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  cursor: 'default',
                }}
              />
            </div>
          ))}
        </div>

        {/* LEFT ARROW - Always works (infinite) */}
        <button
          onClick={goToPrev}
          aria-label="Previous slide"
          className="
            absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20
           text-white
            w-9 h-9 md:w-15 md:h-15 rounded-full
            flex items-center justify-center
            shadow-lg
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition-all duration-300
            hover:scale-110 cursor-pointer
          "
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* RIGHT ARROW - Always works (infinite) */}
        <button
          onClick={goToNext}
          aria-label="Next slide"
          className="
            absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20
              text-white
            w-9 h-9 md:w-15 md:h-15 rounded-full
            flex items-center justify-center
            shadow-lg
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition-all duration-300
            hover:scale-102 cursor-pointer
          "
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* PAGINATION DOTS - OUTSIDE BELOW CAROUSEL */}
      <div className="flex justify-center items-center gap-1.5 py-4 bg-white">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`
              transition-all duration-300 cursor-pointer rounded-full
              ${
                i === index
                  ? 'w-6 h-1.5 bg-header'
                  : 'w-6 h-1.5 bg-gray-300 hover:bg-gray-400'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
