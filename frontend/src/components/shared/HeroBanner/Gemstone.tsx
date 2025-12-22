import React, { useState } from 'react';

const Gemstone = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // This data structure is ready for backend integration
  const categories = [
    {
      id: 1,
      name: 'Necklaces',
      image: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/01_Jan/home/gemstone-necklace.jpg'
    },
    {
      id: 2,
      name: 'Rings',
      image: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/01_Jan/home/Rings.jpg'
    },
    {
      id: 3,
      name: 'Earrings',
      image: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/01_Jan/home/Earrings.jpg'
    },
    {
      id: 4,
      name: 'Bangles',
      image: 'https://static.malabargoldanddiamonds.com/media/wysiwyg/offer_page/2025/01_Jan/home/gemstone-bangles.jpg'
    }
  ];

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - go to next slide (loop back to first if at end)
      setCurrentSlide((prev) => (prev + 1) % categories.length);
    }
    if (isRightSwipe) {
      // Swipe right - go to previous slide (loop to last if at start)
      setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
    }
    setIsDragging(false);
  };

  // Mouse events for desktop dragging
  const onMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(0);
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTouchEnd(e.clientX);
    }
  };

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - go to next slide (loop back to first if at end)
      setCurrentSlide((prev) => (prev + 1) % categories.length);
    }
    if (isRightSwipe) {
      // Swipe right - go to previous slide (loop to last if at start)
      setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
    }
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full py-12 px-2">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif text-gray-800 mb-4">
            Gemstone Jewellery
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Capturing timeless grace in each precious stone
          </p>
        </div>

        {/* Mobile Slider (below md) */}
        <div className="md:hidden">
          <div 
            className="relative overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="w-full shrink-0 px-4"
                >
                  <div className="group relative overflow-hidden rounded-2xl shadow-lg">
                    {/* Image */}
                    <div className="aspect-3/4 overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable="false"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? 'w-8 h-2 bg-gray-800'
                    : 'w-2 h-2 bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid (md and above) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              {/* Image */}
              <div className="aspect-3/4 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gemstone;