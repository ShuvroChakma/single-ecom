import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
  id: number
  image: string
  alt: string
}

const SLIDES: Array<Slide> = [
  { id: 1, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80", alt: "Slide 1" },
  { id: 2, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1920&q=80", alt: "Slide 2" },
  { id: 3, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&q=80", alt: "Slide 3" },
  { id: 4, image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1920&q=80", alt: "Slide 4" },
  { id: 5, image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1920&q=80", alt: "Slide 5" },
  { id: 6, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&q=80", alt: "Slide 6" },
]

export default function Carousel() {
  const [index, setIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  const slideCount = SLIDES.length
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
        className="relative group overflow-hidden w-screen bg-gray-100 h-[250px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]"
        style={{
          cursor: 'default',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)'
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
            transform: `translateX(calc(-${index * 100}% + ${isDragging ? offsetX : 0}px))`,
            transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.id} className="min-w-full h-full shrink-0">
              <img
                src={slide.image}
                alt={slide.alt}
                draggable={false}
                className="w-full h-full object-cover select-none"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  cursor: 'default'
                } as React.CSSProperties}
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
            bg-white/90 hover:bg-white text-gray-800
            w-8 h-8 md:w-10 md:h-10 rounded-full
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
            bg-white/90 hover:bg-white text-gray-800
            w-8 h-8 md:w-10 md:h-10 rounded-full
            flex items-center justify-center
            shadow-lg
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition-all duration-300
            hover:scale-110 cursor-pointer
          "
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

      </div>

      {/* PAGINATION DOTS - OUTSIDE BELOW CAROUSEL */}
      <div className="flex justify-center items-center gap-1.5 py-4 bg-white">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`
              transition-all duration-300 cursor-pointer rounded-full
              ${i === index 
                ? "w-6 h-1.5 bg-header" 
                : "w-6 h-1.5 bg-gray-300 hover:bg-gray-400"
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}